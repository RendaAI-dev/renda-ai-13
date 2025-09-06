-- Fix updated_at column issue for poupeja_scheduled_transactions
-- Ensure the column exists and trigger works properly

-- First, ensure the updated_at column exists
ALTER TABLE public.poupeja_scheduled_transactions 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Update existing records to have updated_at = created_at for consistency
UPDATE public.poupeja_scheduled_transactions 
SET updated_at = created_at 
WHERE updated_at IS NULL;

-- Create a safer trigger function that checks if column exists
CREATE OR REPLACE FUNCTION update_updated_at_column_safe()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the table has updated_at column
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = TG_TABLE_NAME 
        AND column_name = 'updated_at'
        AND table_schema = TG_TABLE_SCHEMA
    ) THEN
        NEW.updated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_poupeja_scheduled_transactions_updated_at ON public.poupeja_scheduled_transactions;

-- Create the new safer trigger
CREATE TRIGGER update_poupeja_scheduled_transactions_updated_at
    BEFORE UPDATE ON public.poupeja_scheduled_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column_safe();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.update_updated_at_column_safe() TO authenticated; 