-- Cloudflare D1 SQL Schema for GPU Specifications Database
CREATE TABLE IF NOT EXISTS gpus (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    brand TEXT NOT NULL,
    chipset TEXT NOT NULL,
    manufacturer TEXT NOT NULL,
    gpu_chip TEXT,
    process_size TEXT,
    cores TEXT,
    memory_size TEXT,
    memory_type TEXT,
    bus_width TEXT,
    bandwidth TEXT,
    boost_clock TEXT,
    tdp_watts TEXT,
    bus_interface TEXT,
    display_outputs TEXT,
    time_spy_score INTEGER DEFAULT 0,
    length_mm REAL NOT NULL,
    height_mm REAL NOT NULL,
    thickness_mm REAL NOT NULL,
    slot_thickness REAL NOT NULL,
    power_connector TEXT NOT NULL,
    recommended_psu_w INTEGER NOT NULL,
    weight_grams INTEGER,
    is_sff_friendly INTEGER DEFAULT 0,
    release_year INTEGER NOT NULL,
    accent_color TEXT,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_gpus_brand ON gpus(brand);
CREATE INDEX IF NOT EXISTS idx_gpus_manufacturer ON gpus(manufacturer);
CREATE INDEX IF NOT EXISTS idx_gpus_chipset ON gpus(chipset);
CREATE INDEX IF NOT EXISTS idx_gpus_dimensions ON gpus(length_mm, slot_thickness);

-- SEED DATA INSERTIONS --
-- Insert statements cleared as requested. Add custom GPU INSERT statements below.
