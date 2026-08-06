-- Cloudflare D1 SQL Schema & Initial Seed Data for GPU Specifications Database
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

-- INITIAL SEED DATA --
INSERT INTO gpus (
    id, name, brand, chipset, manufacturer, gpu_chip, process_size, cores,
    memory_size, memory_type, bus_width, bandwidth, boost_clock, tdp_watts,
    bus_interface, display_outputs, time_spy_score, length_mm, height_mm,
    thickness_mm, slot_thickness, power_connector, recommended_psu_w,
    weight_grams, is_sff_friendly, release_year, accent_color, description
) VALUES (
    'rtx-4090-strix',
    'ROG Strix GeForce RTX 4090 24GB OC',
    'NVIDIA',
    'RTX 4090',
    'ASUS',
    'AD102',
    '4 nm',
    '16,384 Cores',
    '24 GB',
    'GDDR6X',
    '384-bit',
    '1,008 GB/s',
    '2610 MHz',
    '450W',
    'PCIe 4.0 x16',
    '3x DisplayPort 1.4a, 2x HDMI 2.1a',
    36150,
    357.6,
    149.3,
    70.1,
    3.5,
    '16-pin (12VHPWR)',
    850,
    2500,
    0,
    2022,
    '#06b6d4',
    'Flagship ASUS ROG Strix GeForce RTX 4090 card featuring 3.5-slot axial-tech fan cooling chamber.'
) ON CONFLICT(id) DO UPDATE SET
    name=excluded.name,
    time_spy_score=excluded.time_spy_score,
    length_mm=excluded.length_mm;
