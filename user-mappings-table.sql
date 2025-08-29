-- Tabla para mapear WhatsApp JID con emails
CREATE TABLE user_mappings (
  id SERIAL PRIMARY KEY,
  whatsapp_jid VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índice para búsquedas rápidas por WhatsApp JID
CREATE INDEX idx_user_mappings_whatsapp_jid ON user_mappings(whatsapp_jid);

-- Índice para búsquedas por email
CREATE INDEX idx_user_mappings_email ON user_mappings(email);

-- Agregar comentarios
COMMENT ON TABLE user_mappings IS 'Mapeo entre números de WhatsApp y emails de usuarios';
COMMENT ON COLUMN user_mappings.whatsapp_jid IS 'JID de WhatsApp (ej: 573216551350@s.whatsapp.net)';
COMMENT ON COLUMN user_mappings.email IS 'Email del usuario para las tareas';
COMMENT ON COLUMN user_mappings.name IS 'Nombre del usuario (opcional)';