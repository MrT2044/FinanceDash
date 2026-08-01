"use client";

import * as React from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

/**
 * Eigenständiges Aufklappmenü.
 *
 * Ersetzt `@base-ui/react/menu`: Dessen Menü riss beim Öffnen die ganze Seite in
 * die Fehlergrenze — im Kontomenü und beim Kategoriewechsel. Das Sheet aus
 * derselben Bibliothek läuft weiter, betroffen war nur das Menü mit seinem
 * Positioner. Diese Umsetzung kommt ohne Floating-UI, ohne
 * `requestAnimationFrame` und ohne Scroll-Sperre aus; sie hat damit schlicht
 * keine Stellen mehr, an denen sie scheitern kann.
 *
 * Die Schnittstelle bleibt gleich, aufrufende Komponenten ändern sich nicht.
 */

type Align = "start" | "center" | "end";
type Side = "top" | "bottom";

type MenuContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  triggerId: string;
  contentId: string;
};

const MenuContext = React.createContext<MenuContextValue | null>(null);

function useMenuContext(component: string): MenuContextValue {
  const context = React.useContext(MenuContext);
  if (!context) {
    throw new Error(`<${component}> muss innerhalb von <DropdownMenu> stehen.`);
  }
  return context;
}

/**
 * Übernimmt die Eigenschaften eines vorhandenen Elements statt ein eigenes zu
 * rendern (`render`-Prop). Klassen werden zusammengeführt, damit die Gestaltung
 * des übergebenen Elements — etwa die Varianten eines Buttons — erhalten bleibt.
 */
function renderAsChild(
  element: React.ReactElement,
  props: Record<string, unknown>,
): React.ReactElement {
  const ownClassName = (element.props as { className?: string }).className;
  return React.cloneElement(element, {
    ...props,
    className: cn(ownClassName, props.className as string | undefined),
  } as never);
}

function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const id = React.useId();

  const value = React.useMemo<MenuContextValue>(
    () => ({
      open,
      setOpen,
      triggerRef,
      triggerId: `${id}-trigger`,
      contentId: `${id}-content`,
    }),
    [open, id],
  );

  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
}

function DropdownMenuTrigger({
  render,
  className,
  children,
  onClick,
  onKeyDown,
  ...props
}: React.ComponentProps<"button"> & { render?: React.ReactElement }) {
  const menu = useMenuContext("DropdownMenuTrigger");

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    if (event.defaultPrevented) return;
    menu.setOpen(!menu.open);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    // Pfeiltaste öffnet und springt direkt in die Liste.
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      menu.setOpen(true);
    }
  };

  const triggerProps = {
    ...props,
    id: menu.triggerId,
    type: "button" as const,
    "aria-haspopup": "menu" as const,
    "aria-expanded": menu.open,
    "aria-controls": menu.open ? menu.contentId : undefined,
    "data-slot": "dropdown-menu-trigger",
    "data-state": menu.open ? "open" : "closed",
    onClick: handleClick,
    onKeyDown: handleKeyDown,
    ref: menu.triggerRef,
    className,
    children,
  };

  if (render) return renderAsChild(render, triggerProps);
  return <button {...triggerProps} />;
}

/** Ermittelt die Position anhand des Auslösers und hält sie im Sichtfeld. */
function placeContent(
  content: HTMLElement,
  trigger: HTMLElement,
  { align, side, sideOffset }: { align: Align; side: Side; sideOffset: number },
) {
  const margin = 8;
  const anchor = trigger.getBoundingClientRect();
  const width = content.offsetWidth;
  const height = content.offsetHeight;

  let top = side === "bottom" ? anchor.bottom + sideOffset : anchor.top - height - sideOffset;

  // Nicht genug Platz auf der gewünschten Seite? Dann auf die andere klappen.
  if (side === "bottom" && top + height > window.innerHeight - margin) {
    const flipped = anchor.top - height - sideOffset;
    if (flipped >= margin) top = flipped;
  } else if (side === "top" && top < margin) {
    const flipped = anchor.bottom + sideOffset;
    if (flipped + height <= window.innerHeight - margin) top = flipped;
  }

  let left =
    align === "start"
      ? anchor.left
      : align === "end"
        ? anchor.right - width
        : anchor.left + anchor.width / 2 - width / 2;

  // In den sichtbaren Bereich schieben, damit nichts am Rand abgeschnitten wird.
  left = Math.min(Math.max(left, margin), Math.max(margin, window.innerWidth - width - margin));
  top = Math.min(Math.max(top, margin), Math.max(margin, window.innerHeight - height - margin));

  content.style.top = `${Math.round(top)}px`;
  content.style.left = `${Math.round(left)}px`;
  content.style.setProperty("--anchor-width", `${Math.round(anchor.width)}px`);
  content.style.setProperty(
    "--available-height",
    `${Math.round(window.innerHeight - margin * 2)}px`,
  );
  content.style.visibility = "visible";
}

function DropdownMenuContent({
  align = "start",
  side = "bottom",
  sideOffset = 4,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  align?: Align;
  side?: Side;
  sideOffset?: number;
}) {
  const menu = useMenuContext("DropdownMenuContent");
  const contentRef = React.useRef<HTMLDivElement>(null);
  const { open, setOpen, triggerRef } = menu;

  // Positionieren vor dem ersten Zeichnen, danach bei Scrollen und Größenwechsel.
  React.useLayoutEffect(() => {
    if (!open) return;
    const content = contentRef.current;
    const trigger = triggerRef.current;
    if (!content || !trigger) return;

    const place = () => placeContent(content, trigger, { align, side, sideOffset });
    place();

    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open, align, side, sideOffset, triggerRef]);

  // Tastaturbedienung und Schließen bei Klick daneben.
  React.useEffect(() => {
    if (!open) return;

    const close = (refocus: boolean) => {
      setOpen(false);
      if (refocus) triggerRef.current?.focus();
    };

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (contentRef.current?.contains(target)) return;
      if (triggerRef.current?.contains(target)) return;
      close(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close(true);
        return;
      }
      if (event.key === "Tab") {
        close(false);
        return;
      }

      const items = Array.from(
        contentRef.current?.querySelectorAll<HTMLElement>(
          '[role="menuitem"]:not([data-disabled])',
        ) ?? [],
      );
      if (!items.length) return;

      const current = items.indexOf(document.activeElement as HTMLElement);
      let next: number | null = null;

      if (event.key === "ArrowDown") next = current < 0 ? 0 : (current + 1) % items.length;
      else if (event.key === "ArrowUp")
        next = current < 0 ? items.length - 1 : (current - 1 + items.length) % items.length;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = items.length - 1;

      if (next !== null) {
        event.preventDefault();
        items[next].focus();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, setOpen, triggerRef]);

  // Beim Server-Rendern ist das Menü immer geschlossen — kein Hydration-Konflikt.
  if (!open) return null;

  return createPortal(
    <div
      ref={contentRef}
      role="menu"
      id={menu.contentId}
      aria-labelledby={menu.triggerId}
      data-slot="dropdown-menu-content"
      data-side={side}
      data-align={align}
      // Anfangs unsichtbar: Die Position steht erst im Layout-Effekt fest.
      style={{ position: "fixed", top: 0, left: 0, visibility: "hidden" }}
      className={cn(
        "z-50 max-h-(--available-height) min-w-32 origin-top overflow-x-hidden overflow-y-auto",
        "animate-in fade-in-0 zoom-in-95 rounded-xl bg-popover p-1 text-popover-foreground duration-150",
        "shadow-[var(--shadow-soft-lg)] ring-1 ring-foreground/10 outline-none",
        className,
      )}
      {...props}
    >
      {children}
    </div>,
    document.body,
  );
}

function DropdownMenuGroup({ className, ...props }: React.ComponentProps<"div">) {
  return <div role="group" data-slot="dropdown-menu-group" className={className} {...props} />;
}

function DropdownMenuLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<"div"> & { inset?: boolean }) {
  return (
    <div
      data-slot="dropdown-menu-label"
      data-inset={inset}
      className={cn(
        "px-2 py-1.5 text-xs font-medium text-muted-foreground data-inset:pl-7",
        className,
      )}
      {...props}
    />
  );
}

function DropdownMenuItem({
  className,
  inset,
  variant = "default",
  closeOnClick = true,
  disabled,
  render,
  onClick,
  children,
  ...props
}: Omit<React.ComponentProps<"button">, "type"> & {
  inset?: boolean;
  variant?: "default" | "destructive";
  closeOnClick?: boolean;
  render?: React.ReactElement;
}) {
  const menu = useMenuContext("DropdownMenuItem");

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
    if (closeOnClick && !event.defaultPrevented) menu.setOpen(false);
  };

  const itemProps = {
    ...props,
    role: "menuitem" as const,
    tabIndex: -1,
    "data-slot": "dropdown-menu-item",
    "data-inset": inset,
    "data-variant": variant,
    "data-disabled": disabled ? "" : undefined,
    "aria-disabled": disabled || undefined,
    onClick: handleClick,
    className: cn(
      "relative flex w-full min-h-9 cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm",
      "transition-colors outline-none select-none",
      "hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground",
      "data-inset:pl-7",
      "data-[variant=destructive]:text-destructive data-[variant=destructive]:hover:bg-destructive/10 data-[variant=destructive]:focus-visible:bg-destructive/10",
      "data-disabled:pointer-events-none data-disabled:opacity-50",
      "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
      className,
    ),
    children,
  };

  if (render) return renderAsChild(render, itemProps);
  return <button type="button" disabled={disabled} {...itemProps} />;
}

function DropdownMenuSeparator({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      role="separator"
      data-slot="dropdown-menu-separator"
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  );
}

function DropdownMenuShortcut({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn("ml-auto text-xs tracking-widest text-muted-foreground", className)}
      {...props}
    />
  );
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
};
