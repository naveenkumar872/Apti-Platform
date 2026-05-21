-- Migration 003: Add source column to materials table
ALTER TABLE materials ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'manual';
