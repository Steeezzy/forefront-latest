-- Migration: 004_add_scraping_enhancements.sql
-- Adds columns to support priority page scraping and AI summarization

ALTER TABLE knowledge_sources ADD COLUMN IF NOT EXISTS scrape_mode VARCHAR(20) DEFAULT 'priority';
ALTER TABLE website_pages ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE website_pages ADD COLUMN IF NOT EXISTS priority_score INTEGER DEFAULT 0;
ALTER TABLE website_pages ADD COLUMN IF NOT EXISTS tags TEXT[];
