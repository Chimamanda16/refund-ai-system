-- Phase 1 schema. Applied once by the migration runner (tracked in schema_migrations).

CREATE TABLE customers (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(120) NOT NULL,
  email       VARCHAR(255) NOT NULL UNIQUE,
  phone       VARCHAR(32),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE orders (
  id            SERIAL PRIMARY KEY,
  customer_id   INTEGER NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  order_number  VARCHAR(32) NOT NULL UNIQUE,
  order_date    TIMESTAMPTZ NOT NULL,
  status        VARCHAR(20) NOT NULL
                CHECK (status IN ('processing', 'shipped', 'delivered', 'cancelled')),
  total_amount  NUMERIC(10,2) NOT NULL CHECK (total_amount >= 0),
  currency      CHAR(3) NOT NULL DEFAULT 'USD',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);

CREATE TABLE order_items (
  id             SERIAL PRIMARY KEY,
  order_id       INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_name   VARCHAR(200) NOT NULL,
  sku            VARCHAR(64) NOT NULL,
  quantity       INTEGER NOT NULL CHECK (quantity > 0),
  unit_price     NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
  -- Item-level: one order can mix refundable and final-sale items.
  is_final_sale  BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);

CREATE TABLE refund_requests (
  id                SERIAL PRIMARY KEY,
  customer_id       INTEGER NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  order_id          INTEGER NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  requested_amount  NUMERIC(10,2) NOT NULL CHECK (requested_amount > 0),
  reason            VARCHAR(40) NOT NULL
                    CHECK (reason IN ('damaged', 'incorrect_item', 'not_delivered',
                                      'not_as_described', 'changed_mind', 'other')),
  customer_message  TEXT,
  status            VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'denied', 'escalated')),
  -- Populated in later phases (AI triage + policy engine). Nullable on purpose.
  ai_category       VARCHAR(60),
  ai_confidence     NUMERIC(4,3) CHECK (ai_confidence IS NULL OR ai_confidence BETWEEN 0 AND 1),
  ai_summary        TEXT,
  ai_suspicious     BOOLEAN,
  policy_result     VARCHAR(40),
  policy_reason     TEXT,
  resolution_reason TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_refund_requests_customer_id ON refund_requests(customer_id);
CREATE INDEX idx_refund_requests_order_id ON refund_requests(order_id);
CREATE INDEX idx_refund_requests_status ON refund_requests(status);

CREATE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_refund_requests_updated_at
  BEFORE UPDATE ON refund_requests
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Supports partial refunds and multi-item selection.
CREATE TABLE refund_request_items (
  id                  SERIAL PRIMARY KEY,
  refund_request_id   INTEGER NOT NULL REFERENCES refund_requests(id) ON DELETE CASCADE,
  order_item_id       INTEGER NOT NULL REFERENCES order_items(id) ON DELETE RESTRICT,
  requested_quantity  INTEGER NOT NULL CHECK (requested_quantity > 0),
  requested_amount    NUMERIC(10,2) NOT NULL CHECK (requested_amount >= 0),
  UNIQUE (refund_request_id, order_item_id)
);
CREATE INDEX idx_refund_request_items_order_item_id ON refund_request_items(order_item_id);

CREATE TABLE refund_messages (
  id                 SERIAL PRIMARY KEY,
  refund_request_id  INTEGER NOT NULL REFERENCES refund_requests(id) ON DELETE CASCADE,
  sender_type        VARCHAR(20) NOT NULL CHECK (sender_type IN ('customer', 'admin', 'system')),
  message            TEXT NOT NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_refund_messages_request ON refund_messages(refund_request_id, created_at);

CREATE TABLE audit_logs (
  id                 SERIAL PRIMARY KEY,
  refund_request_id  INTEGER NOT NULL REFERENCES refund_requests(id) ON DELETE CASCADE,
  actor_type         VARCHAR(20) NOT NULL CHECK (actor_type IN ('customer', 'admin', 'system', 'ai')),
  actor_id           VARCHAR(64),
  action             VARCHAR(80) NOT NULL,
  previous_status    VARCHAR(20) CHECK (previous_status IS NULL OR previous_status IN ('pending', 'approved', 'denied', 'escalated')),
  new_status         VARCHAR(20) CHECK (new_status IS NULL OR new_status IN ('pending', 'approved', 'denied', 'escalated')),
  reason             TEXT,
  metadata           JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_audit_logs_request ON audit_logs(refund_request_id, created_at);

-- INTERNAL ONLY: never select from this table in customer-facing code paths.
CREATE TABLE admin_notes (
  id                 SERIAL PRIMARY KEY,
  refund_request_id  INTEGER NOT NULL REFERENCES refund_requests(id) ON DELETE CASCADE,
  admin_name         VARCHAR(120) NOT NULL,
  note               TEXT NOT NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_admin_notes_request ON admin_notes(refund_request_id, created_at);
