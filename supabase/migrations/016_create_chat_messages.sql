    -- Create chat_messages table for individual messages in a chat
    create table chat_messages (
    id uuid primary key default uuid_generate_v4(),
    chat_id uuid references patient_doctor_chats(id) on delete cascade not null,
    sender_id uuid references auth.users(id) not null,
    message_type text default 'text', -- text, image, document, prescription, lab_result
    content text,
    attachments jsonb, -- Array of {url, type, name}
    is_read boolean default false,
    read_at timestamp with time zone,
    edited_at timestamp with time zone,
    doctor_action text, -- 'prescription_suggested', 'follow_up_needed', etc.
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
    );

    -- Create indexes
    create index chat_messages_chat_id_idx on chat_messages(chat_id);
    create index chat_messages_sender_id_idx on chat_messages(sender_id);
    create index chat_messages_created_at_idx on chat_messages(created_at);
    create index chat_messages_is_read_idx on chat_messages(is_read);

    -- Enable RLS
    alter table chat_messages enable row level security;

    -- Users can view messages from their chats
    create policy "Users can view messages from their chats" on chat_messages
    for select using (
        EXISTS (
        SELECT 1 FROM patient_doctor_chats pdc
        WHERE pdc.id = chat_messages.chat_id
        AND (auth.uid() = pdc.patient_id OR auth.uid() = pdc.doctor_id)
        )
    );

    -- Users can insert messages in their chats
    create policy "Users can insert messages in their chats" on chat_messages
    for insert with check (
        EXISTS (
        SELECT 1 FROM patient_doctor_chats pdc
        WHERE pdc.id = chat_id
        AND (auth.uid() = pdc.patient_id OR auth.uid() = pdc.doctor_id)
        AND auth.uid() = sender_id
        )
    );

    -- Users can update their own messages
    create policy "Users can update their own messages" on chat_messages
    for update using (auth.uid() = sender_id);

    -- Function to automatically update updated_at timestamp
    create or replace function update_chat_messages_updated_at()
    returns trigger as $$
    begin
    new.updated_at = now();
    return new;
    end;
    $$ language plpgsql;

    -- Trigger
    create trigger update_chat_messages_updated_at
    before update on chat_messages
    for each row
    execute function update_chat_messages_updated_at();
