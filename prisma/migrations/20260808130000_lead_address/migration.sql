-- Leads gain an address column so the bulk upload can capture it and carry it
-- through to the customer master (Customer.shipAddress) on conversion.
ALTER TABLE "Lead" ADD COLUMN "address" TEXT NOT NULL DEFAULT '';
