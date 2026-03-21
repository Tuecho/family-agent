import { useState, useEffect } from 'react';
import { Bell, Mail, Clock, Send, Loader2, Check, X } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

interface NotificationSettings {
  email_enabled: number;
  email_to: string;
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  notify_time: string;
}

export function NotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings>({
    email_enabled: 0,
    email_to: '',
    smtp_host: 'smtp.gmail.com',
    smtp_port: 587,
    smtp_user: '',
    notify_time: '22:00'
  });
  const [smtpPassword, setSmtpPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const resp = await fetch(`${API_URL}/api/notifications/settings`);
      const data = await resp.json();
      setSettings({
        email_enabled: data.email_enabled || 0,
        email_to: data.email_to || '',
        smtp_host: data.smtp_host || 'smtp.gmail.com',
        smtp_port: data.smtp_port || 587,
        smtp_user: data.smtp_user || '',
        notify_time: data.notify_time || '22:00'
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const resp = await fetch(`${API_URL}/api/notifications/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...settings, smtp_password: smtpPassword })
      });
      const data = await resp.json();
      
      if (data.success) {
        setMessage({ type: 'success', text: 'Configuración guardada' });
        setSmtpPassword('');
      } else {
        setMessage({ type: 'error', text: data.error || 'Error guardando' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error de conexión' });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!settings.email_to || !settings.smtp_user || !smtpPassword) {
      setMessage({ type: 'error', text: 'Completa todos los campos de email' });
      return;
    }

    setTesting(true);
    setMessage(null);

    try {
      const resp = await fetch(`${API_URL}/api/notifications/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email_to: settings.email_to,
          smtp_host: settings.smtp_host,
          smtp_port: settings.smtp_port,
          smtp_user: settings.smtp_user,
          smtp_password: smtpPassword
        })
      });
      const data = await resp.json();
      
      if (data.success) {
        setMessage({ type: 'success', text: 'Email de prueba enviado' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Error enviando' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error de conexión' });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Cargando...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Bell className="text-primary" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold">Notificaciones por Email</h2>
            <p className="text-sm text-gray-500">Recibe un resumen de tu agenda cada día</p>
          </div>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
            message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {message.type === 'success' ? <Check size={18} /> : <X size={18} />}
            {message.text}
          </div>
        )}

        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.email_enabled === 1}
              onChange={(e) => setSettings({ ...settings, email_enabled: e.target.checked ? 1 : 0 })}
              className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="font-medium">Activar notificaciones por email</span>
          </label>

          {settings.email_enabled === 1 && (
            <>
              <div className="border-t pt-4 mt-4">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Mail size={18} />
                  Configuración del email
                </h3>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email de destino
                    </label>
                    <input
                      type="email"
                      value={settings.email_to}
                      onChange={(e) => setSettings({ ...settings, email_to: e.target.value })}
                      placeholder="tu@email.com"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Usuario SMTP (tu email)
                    </label>
                    <input
                      type="email"
                      value={settings.smtp_user}
                      onChange={(e) => setSettings({ ...settings, smtp_user: e.target.value })}
                      placeholder="tu@gmail.com"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contraseña SMTP
                    </label>
                    <input
                      type="password"
                      value={smtpPassword}
                      onChange={(e) => setSmtpPassword(e.target.value)}
                      placeholder="Contraseña de aplicación"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Usa una contraseña de aplicación de Gmail
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hora de envío
                    </label>
                    <div className="relative">
                      <Clock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="time"
                        value={settings.notify_time}
                        onChange={(e) => setSettings({ ...settings, notify_time: e.target.value })}
                        className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Te envía un email con los eventos del día siguiente
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">Cómo obtener la contraseña de aplicación:</h4>
                <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                  <li>Ve a tu cuenta de Google → Seguridad</li>
                  <li>Activa la verificación en 2 pasos</li>
                  <li>Busca "Contraseñas de aplicación" en la configuración</li>
                  <li>Crea una nueva para "Correo"</li>
                  <li>Copia la contraseña de 16 caracteres</li>
                </ol>
              </div>
            </>
          )}

          <div className="flex justify-between items-center pt-4 border-t">
            <button
              onClick={handleTest}
              disabled={testing}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              {testing ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              Enviar email de prueba
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              {saving && <Loader2 size={18} className="animate-spin" />}
              Guardar configuración
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
