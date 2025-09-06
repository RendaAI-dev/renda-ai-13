-- Add updated_at column to poupeja_transactions table
-- This fixes the issue where transaction updates fail because the column doesn't exist

-- Add the updated_at column to poupeja_transactions
ALTER TABLE poupeja_transactions 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing records to have updated_at = created_at
UPDATE poupeja_transactions 
SET updated_at = created_at 
WHERE updated_at IS NULL;

-- Create or replace the trigger function for updating updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_poupeja_transactions_updated_at ON poupeja_transactions;

-- Create the trigger for poupeja_transactions
CREATE TRIGGER update_poupeja_transactions_updated_at
    BEFORE UPDATE ON poupeja_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verify the column was added
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'poupeja_transactions' 
        AND column_name = 'updated_at'
    ) THEN
        RAISE EXCEPTION 'Failed to add updated_at column to poupeja_transactions table';
    END IF;
    
    RAISE NOTICE 'Successfully added updated_at column to poupeja_transactions table';
END $$;