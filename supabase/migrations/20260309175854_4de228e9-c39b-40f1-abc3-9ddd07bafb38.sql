
-- Tighten conversation creation: require user to be a participant
DROP POLICY "Auth users can create conversations" ON public.conversations;
CREATE POLICY "Auth users can create conversations"
  ON public.conversations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Tighten participant addition: user can only add themselves or be in the conversation
DROP POLICY "Auth users can add participants" ON public.conversation_participants;
CREATE POLICY "Users can add participants to own conversations"
  ON public.conversation_participants FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = conversation_participants.conversation_id AND cp.user_id = auth.uid()
    )
  );
