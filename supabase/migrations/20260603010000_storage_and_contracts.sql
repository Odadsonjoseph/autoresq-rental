-- Storage and Contracts Setup
INSERT INTO storage.buckets (id, name, public, file_size_limit, file_extensions)
VALUES ("verifications", "verifications", true, 10485760, ARRAY[".jpg", ".jpeg", ".png", ".pdf"])
ON CONFLICT (id) DO NOTHING;
