import { Bell } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { notificationApi } from '../api/endpoints';
import { useSocket } from '../context/SocketContext';

export default function NotificationBell() {
  const { socket } = useSocket();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    notificationApi.all().then(setNotifications).catch(() => setNotifications([]));
  }, []);

  useEffect(() => {
    if (!socket) {
      return undefined;
    }

    const onNewNotification = (notification) => {
      setNotifications((current) => [notification, ...current]);
    };

    socket.on('notification:new', onNewNotification);
    return () => socket.off('notification:new', onNewNotification);
  }, [socket]);

  const unread = useMemo(() => notifications.filter((notification) => !notification.isRead).length, [notifications]);

  const markAllRead = async () => {
    await notificationApi.readAll();
    setNotifications((current) => current.map((notification) => ({ ...notification, isRead: true })));
  };

  return (
    <div className="notification-shell">
      <button className="icon-button" onClick={() => setOpen((value) => !value)} aria-label="Notifications" title="Notifications">
        <Bell size={18} />
        {!!unread && <span className="badge">{unread}</span>}
      </button>
      {open && (
        <div className="notification-menu">
          <div className="notification-header">
            <strong>Notifications</strong>
            <button type="button" onClick={markAllRead}>
              Mark all read
            </button>
          </div>
          {notifications.slice(0, 8).map((notification) => (
            <div className={notification.isRead ? 'notification read' : 'notification'} key={notification._id}>
              <span>{notification.message}</span>
              <small>{new Date(notification.createdAt).toLocaleString()}</small>
            </div>
          ))}
          {!notifications.length && <div className="empty-state">No notifications yet.</div>}
        </div>
      )}
    </div>
  );
}
