import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, Info, Trash2, MoreVertical, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { Notification } from "@shared/schema";
import { StudentLayout } from "@/components/layout/StudentLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
  });

  const readMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("PATCH", `/api/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const readAllMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", "/api/notifications/read-all");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/notifications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const filteredNotifications = notifications.filter(n => 
    n.title?.toLowerCase().includes(search.toLowerCase()) || 
    n.message.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-serif">Notifications</h1>
            <p className="text-muted-foreground mt-1">Stay updated with your enrollment status and school announcements.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => readAllMutation.mutate()}
              disabled={notifications.filter(n => !n.isRead).length === 0}
            >
              <Check className="h-4 w-4" />
              Mark all as read
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-white p-4 rounded-lg border shadow-sm">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search notifications..." 
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="ghost" size="icon">
            <Filter className="h-4 w-4 text-slate-500" />
          </Button>
        </div>

        <Card className="border-none shadow-md overflow-hidden bg-slate-50/50">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4 bg-white">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex gap-4">
                    <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-3 w-3/4" />
                      <Skeleton className="h-2 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-center bg-white">
                <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center mb-6">
                  <Bell className="h-10 w-10 text-slate-300" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900">No notifications found</h3>
                <p className="text-slate-500 max-w-sm mt-2">
                  {search ? `No notifications match "${search}". Try different keywords.` : "You don't have any notifications at the moment."}
                </p>
                {search && (
                  <Button variant="link" onClick={() => setSearch("")} className="mt-4">
                    Clear search
                  </Button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-slate-100 bg-white">
                {filteredNotifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className={`p-6 transition-all relative ${!notification.isRead ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-slate-50'}`}
                  >
                    <div className="flex gap-5">
                      <div className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                        !notification.isRead ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {notification.type === 'portal' ? <Info className="h-6 w-6" /> : <Bell className="h-6 w-6" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <h4 className={`text-base ${!notification.isRead ? 'font-bold text-slate-900 underline decoration-primary/30 underline-offset-4' : 'font-medium text-slate-700'}`}>
                              {notification.title}
                            </h4>
                            {!notification.isRead && (
                              <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[10px] uppercase tracking-wider font-bold h-5">New</Badge>
                            )}
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {!notification.isRead && (
                                <DropdownMenuItem onClick={() => readMutation.mutate(notification.id)}>
                                  <Check className="mr-2 h-4 w-4" /> Mark as read
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => deleteMutation.mutate(notification.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <p className={`mt-2 text-sm leading-relaxed max-w-3xl ${!notification.isRead ? 'text-slate-800' : 'text-slate-600'}`}>
                          {notification.message}
                        </p>
                        <div className="mt-4 flex items-center gap-4 text-xs font-medium text-slate-400">
                          <span className="flex items-center gap-1">
                            {format(new Date(notification.sentAt), "MMMM d, yyyy 'at' h:mm a")}
                          </span>
                          <span className="h-1 w-1 rounded-full bg-slate-300" />
                          <span className="capitalize">{notification.type} message</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </StudentLayout>
  );
}
