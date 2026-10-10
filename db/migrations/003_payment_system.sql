-- =====================================================
-- BITZY PREMIUM COURSE SYSTEM (PRODUCTION)
-- Works with existing Bitzy schema
-- =====================================================

--------------------------------------------------------
-- UPDATE COURSES TABLE
--------------------------------------------------------

ALTER TABLE courses
ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT FALSE;

ALTER TABLE courses
ADD COLUMN IF NOT EXISTS price INTEGER DEFAULT 0;

ALTER TABLE courses
ADD COLUMN IF NOT EXISTS discount_price INTEGER DEFAULT 0;

ALTER TABLE courses
ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'INR';

ALTER TABLE courses
ADD COLUMN IF NOT EXISTS thumbnail TEXT;

ALTER TABLE courses
ADD COLUMN IF NOT EXISTS preview_video TEXT;

ALTER TABLE courses
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'draft';

ALTER TABLE courses
ADD COLUMN IF NOT EXISTS total_sales INTEGER DEFAULT 0;

ALTER TABLE courses
ADD COLUMN IF NOT EXISTS total_revenue INTEGER DEFAULT 0;

ALTER TABLE courses
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

--------------------------------------------------------
-- PURCHASED COURSES
--------------------------------------------------------

CREATE TABLE IF NOT EXISTS purchased_courses (

    id SERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,

    payment_id TEXT UNIQUE,

    order_id TEXT UNIQUE,

    razorpay_signature TEXT,

    amount INTEGER NOT NULL,

    currency VARCHAR(10) DEFAULT 'INR',

    payment_method VARCHAR(50),

    status VARCHAR(20) DEFAULT 'pending',

    coupon_code VARCHAR(50),

    discount_amount INTEGER DEFAULT 0,

    purchased_at TIMESTAMP DEFAULT NOW(),

    unlocked_at TIMESTAMP DEFAULT NOW(),

    expires_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT NOW(),

    updated_at TIMESTAMP DEFAULT NOW()

);

--------------------------------------------------------
-- PAYMENTS TABLE
--------------------------------------------------------

CREATE TABLE IF NOT EXISTS payments (

    id SERIAL PRIMARY KEY,

    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,

    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,

    razorpay_order_id TEXT UNIQUE NOT NULL,

    razorpay_payment_id TEXT UNIQUE,

    razorpay_signature TEXT,

    amount INTEGER NOT NULL,

    currency VARCHAR(10) DEFAULT 'INR',

    payment_method VARCHAR(50),

    payment_gateway VARCHAR(20) DEFAULT 'razorpay',

    status VARCHAR(20) DEFAULT 'created',

    refunded BOOLEAN DEFAULT FALSE,

    refund_amount INTEGER DEFAULT 0,

    refund_reason TEXT,

    webhook_received BOOLEAN DEFAULT FALSE,

    notes JSONB,

    created_at TIMESTAMP DEFAULT NOW(),

    paid_at TIMESTAMP

);

--------------------------------------------------------
-- COUPONS TABLE
--------------------------------------------------------

CREATE TABLE IF NOT EXISTS coupons (

    id SERIAL PRIMARY KEY,

    code VARCHAR(50) UNIQUE NOT NULL,

    title VARCHAR(255),

    description TEXT,

    discount_type VARCHAR(20) DEFAULT 'percentage',

    discount_value INTEGER NOT NULL,

    minimum_purchase INTEGER DEFAULT 0,

    max_discount INTEGER,

    usage_limit INTEGER DEFAULT 100,

    used_count INTEGER DEFAULT 0,

    active BOOLEAN DEFAULT TRUE,

    expires_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT NOW()

);

--------------------------------------------------------
-- REVENUE STATS
--------------------------------------------------------

CREATE TABLE IF NOT EXISTS revenue_stats (

    id SERIAL PRIMARY KEY,

    date DATE UNIQUE,

    total_orders INTEGER DEFAULT 0,

    total_revenue INTEGER DEFAULT 0,

    successful_payments INTEGER DEFAULT 0,

    refunded_payments INTEGER DEFAULT 0,

    failed_payments INTEGER DEFAULT 0,

    created_at TIMESTAMP DEFAULT NOW()

);

--------------------------------------------------------
-- INDEXES
--------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_courses_paid ON courses(is_paid);
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);

CREATE INDEX IF NOT EXISTS idx_purchase_user ON purchased_courses(user_id);
CREATE INDEX IF NOT EXISTS idx_purchase_course ON purchased_courses(course_id);
CREATE INDEX IF NOT EXISTS idx_purchase_status ON purchased_courses(status);

CREATE INDEX IF NOT EXISTS idx_payment_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_status ON payments(status);

--------------------------------------------------------
-- SAMPLE COUPONS
--------------------------------------------------------

INSERT INTO coupons (
    code,
    title,
    discount_value,
    discount_type
)
VALUES
('BITZY50','Launch Offer 50% OFF',50,'percentage'),
('STUDENT25','Student Discount',25,'percentage'),
('REACT100','React ₹100 OFF',100,'flat')
ON CONFLICT (code) DO NOTHING;



-- ============================================================
-- REFERENCE ONLY 
-- payment code silently breaks if these are off.
--
-- Convention used: snake_case, matching src/lib/db.ts (the code
-- path your app actually reads courses through at runtime), NOT the
-- camelCase columns already in db/schema.ts (that mismatch is a
-- pre-existing issue in this codebase, not something introduced here).
-- ============================================================

-- Premium fields on courses
ALTER TABLE courses
 ADD COLUMN IF NOT EXISTS is_paid boolean NOT NULL DEFAULT false,
 ADD COLUMN IF NOT EXISTS price numeric(10,2) NOT NULL DEFAULT 0,
 ADD COLUMN IF NOT EXISTS discount_price numeric(10,2),
 ADD COLUMN IF NOT EXISTS currency varchar(10) NOT NULL DEFAULT 'INR',
 ADD COLUMN IF NOT EXISTS thumbnail text,
 ADD COLUMN IF NOT EXISTS preview_video text,
 ADD COLUMN IF NOT EXISTS status varchar(20) NOT NULL DEFAULT 'draft',
 ADD COLUMN IF NOT EXISTS total_sales integer NOT NULL DEFAULT 0,
 ADD COLUMN IF NOT EXISTS total_revenue numeric(12,2) NOT NULL DEFAULT 0,
 ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DO $$ BEGIN
 CREATE TYPE payment_status AS ENUM ('created', 'captured', 'failed', 'refunded');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
 CREATE TYPE discount_type AS ENUM ('percentage', 'flat');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS payments (
 id serial PRIMARY KEY,
 user_id uuid NOT NULL REFERENCES auth.users(id),
 course_id integer NOT NULL REFERENCES courses(id),
 razorpay_order_id varchar(100) NOT NULL UNIQUE,
 razorpay_payment_id varchar(100),
 razorpay_signature text,
 amount numeric(10,2) NOT NULL,
 currency varchar(10) NOT NULL DEFAULT 'INR',
 status payment_status NOT NULL DEFAULT 'created',
 coupon_code varchar(50),
 discount_amount numeric(10,2) NOT NULL DEFAULT 0,
 receipt varchar(100),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS payments_user_id_idx ON payments(user_id);
CREATE INDEX IF NOT EXISTS payments_course_id_idx ON payments(course_id);
CREATE INDEX IF NOT EXISTS payments_status_idx ON payments(status);

CREATE TABLE IF NOT EXISTS purchased_courses (
 id serial PRIMARY KEY,
 user_id uuid NOT NULL REFERENCES auth.users(id),
 course_id integer NOT NULL REFERENCES courses(id),
 payment_id integer REFERENCES payments(id),
 amount_paid numeric(10,2) NOT NULL,
 purchased_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(user_id, course_id)
);
CREATE INDEX IF NOT EXISTS pc_user_id_idx ON purchased_courses(user_id);

CREATE TABLE IF NOT EXISTS coupons (
 id serial PRIMARY KEY,
 code varchar(50) NOT NULL UNIQUE,
 discount_type discount_type NOT NULL,
 discount_value numeric(10,2) NOT NULL,
 max_discount_amount numeric(10,2),
 min_purchase_amount numeric(10,2) NOT NULL DEFAULT 0,
 usage_limit integer,
 used_count integer NOT NULL DEFAULT 0,
 expiry_date timestamptz,
 is_active boolean NOT NULL DEFAULT true,
 applicable_course_ids jsonb,
 created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS revenue_stats (
 id serial PRIMARY KEY,
 date date NOT NULL UNIQUE,
 total_orders integer NOT NULL DEFAULT 0,
 total_revenue numeric(12,2) NOT NULL DEFAULT 0,
 refund_count integer NOT NULL DEFAULT 0,
 refund_amount numeric(12,2) NOT NULL DEFAULT 0
);

-- NOTE ON RLS: api/queries/connection.ts builds the backend Supabase
-- client with SUPABASE_PUBLISHABLE_KEY (anon key) and never attaches a
-- per-request user session otherwise every server-side read/write will fail silently.
-- If your other tables already have RLS+anon policies, mirror those
-- here instead of leaving RLS off.