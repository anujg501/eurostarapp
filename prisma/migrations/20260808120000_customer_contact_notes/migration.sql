-- CRM: company + contact person + special notes.
-- Customer.name already holds the company/firm; add a free-text notes column.
-- Customer.contact already exists (contact person / "Customer name").
ALTER TABLE "Customer" ADD COLUMN "notes" TEXT;

-- Leads gain a contact-person column so the bulk upload can carry it through to
-- the customer master when a lead is converted.
ALTER TABLE "Lead" ADD COLUMN "contact" TEXT NOT NULL DEFAULT '';
