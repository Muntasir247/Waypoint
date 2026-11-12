"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Check,
  CheckSquare,
  ArrowRightCircle,
  MessageSquare,
  AlertCircle,
  Clock,
  Trophy,
  Users,
  Loader2,
  ExternalLink,
} from "lucide-react";
import {
  getNotificationsAction,
  markNotificationReadAction,
  markAllNotificationsReadAction,
} from "@/features/notifications/actions";
import type { FormattedNotification, NotificationType } from "@/features/notifications/schemas";

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case "ASSIGNMENT":
      return <CheckSquare className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />;
    case "STATUS_CHANGE":
      return <ArrowRightCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
    case "MENTION":
      return <MessageSquare className="h-4 w-4 text-purple-600 dark:text-purple-400" />;
    case "BLOCKED":
      return <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />;
    case "DUE_SOON":
    case "OVERDUE":
      return <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />;
    case "MONTHLY_RESULTS":
      return <Trophy className="h-4 w-4 text-amber-500 dark:text-amber-300" />;
    case "INVITE":
      return <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />;
    default:
      return <Bell className="text-muted-foreground h-4 w-4" />;
  }
}

function timeAgo(date: Date | string): string {
  const d = new Date(date);
  const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);

  if (diffSec < 60) return "Just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
  return d.toLocaleDateString();
}

export function NotificationBell() {
  const router = useRouter();
  const [isOpen, setIsOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"ALL" | "UNREAD">("ALL");
  const [notifications, setNotifications] = React.useState<FormattedNotification[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const fetchNotifications = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getNotificationsAction({
        unreadOnly: activeTab === "UNREAD",
        limit: 30,
      });
      if (res.notifications) {
        setNotifications(res.notifications);
        setUnreadCount(res.unreadCount);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  React.useEffect(() => {
    let active = true;
    getNotificationsAction({
      unreadOnly: activeTab === "UNREAD",
      limit: 30,
    }).then((res) => {
      if (!active) return;
      if (res.notifications) {
        setNotifications(res.notifications);
        setUnreadCount(res.unreadCount);
      }
    });

    const interval = setInterval(() => {
      getNotificationsAction({
        unreadOnly: activeTab === "UNREAD",
        limit: 30,
      }).then((res) => {
        if (!active) return;
        if (res.notifications) {
          setNotifications(res.notifications);
          setUnreadCount(res.unreadCount);
        }
      });
    }, 30000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [activeTab]);

  // Click outside listener
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAllRead = async () => {
    await markAllNotificationsReadAction();
    setNotifications((prev) =>
      prev.map((n) => ({
        ...n,
        readAt: new Date(),
      })),
    );
    setUnreadCount(0);
  };

  const handleNotificationClick = async (notif: FormattedNotification) => {
    if (!notif.readAt) {
      await markNotificationReadAction({ notificationId: notif.id });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, readAt: new Date() } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    setIsOpen(false);
    if (notif.url) {
      router.push(notif.url);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger */}
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className="border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground relative inline-flex h-9 w-9 items-center justify-center rounded-lg border p-2 shadow-xs transition-colors"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="ring-card absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-600 px-1 font-mono text-[10px] font-bold text-white ring-2">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="border-border bg-card animate-in fade-in-0 zoom-in-95 absolute right-0 z-50 mt-2 flex w-80 flex-col rounded-2xl border shadow-2xl sm:w-96">
          {/* Header */}
          <div className="border-border flex items-center justify-between border-b p-3.5">
            <div className="flex items-center gap-2">
              <h3 className="text-foreground text-xs font-bold">Notifications</h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300">
                  {unreadCount} unread
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-muted-foreground flex items-center gap-1 text-[11px] font-medium transition-colors hover:text-indigo-600 dark:hover:text-indigo-400"
              >
                <Check className="h-3 w-3" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="border-border bg-muted/20 flex border-b px-3 pt-2">
            <button
              type="button"
              onClick={() => setActiveTab("ALL")}
              className={`border-b-2 px-3 pb-2 text-xs font-semibold transition-colors ${
                activeTab === "ALL"
                  ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                  : "text-muted-foreground hover:text-foreground border-transparent"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("UNREAD")}
              className={`border-b-2 px-3 pb-2 text-xs font-semibold transition-colors ${
                activeTab === "UNREAD"
                  ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                  : "text-muted-foreground hover:text-foreground border-transparent"
              }`}
            >
              Unread
            </button>
          </div>

          {/* Notifications List */}
          <div className="divide-border/60 max-h-80 divide-y overflow-y-auto">
            {isLoading ? (
              <div className="flex h-36 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="bg-muted text-muted-foreground mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl">
                  <Bell className="h-5 w-5 opacity-40" />
                </div>
                <p className="text-foreground text-xs font-semibold">No notifications</p>
                <p className="text-muted-foreground text-[11px]">
                  {activeTab === "UNREAD"
                    ? "You are all caught up!"
                    : "Important updates will appear here."}
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const isUnread = !notif.readAt;
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`hover:bg-muted/50 group flex cursor-pointer items-start gap-3 p-3 transition-colors ${
                      isUnread ? "bg-indigo-50/40 dark:bg-indigo-950/20" : ""
                    }`}
                  >
                    <div className="bg-muted flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                      {getNotificationIcon(notif.type)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h4
                          className={`truncate text-xs ${
                            isUnread
                              ? "text-foreground font-bold"
                              : "text-foreground/80 font-medium"
                          }`}
                        >
                          {notif.title}
                        </h4>
                        <span className="text-muted-foreground shrink-0 text-[10px]">
                          {timeAgo(notif.createdAt)}
                        </span>
                      </div>

                      <p className="text-muted-foreground mt-0.5 line-clamp-2 text-[11px] leading-relaxed">
                        {notif.description}
                      </p>
                    </div>

                    {isUnread && (
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="border-border bg-muted/20 flex items-center justify-between border-t p-2.5 px-3.5 text-[11px]">
            <span className="text-muted-foreground">Waypoint In-App Alerts</span>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                router.push("/board");
              }}
              className="flex items-center gap-1 font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
            >
              <span>Go to Board</span>
              <ExternalLink className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
