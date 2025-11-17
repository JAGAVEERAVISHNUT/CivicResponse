-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Issues policies
-- Citizens can view their own issues
CREATE POLICY "Citizens can view their own issues" ON public.issues
  FOR SELECT USING (
    auth.uid() = reporter_id OR
    auth.uid() IN (
      SELECT id FROM public.profiles 
      WHERE role IN ('l1_officer', 'l2_officer', 'admin')
    )
  );

-- Citizens can insert issues
CREATE POLICY "Citizens can create issues" ON public.issues
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- Officers and admins can update issues
CREATE POLICY "Officers and admins can update issues" ON public.issues
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT id FROM public.profiles 
      WHERE role IN ('l1_officer', 'l2_officer', 'admin')
    )
  );

-- Issue comments policies
CREATE POLICY "Users can view comments on their issues" ON public.issue_comments
  FOR SELECT USING (
    -- User is the reporter of the issue
    issue_id IN (SELECT id FROM public.issues WHERE reporter_id = auth.uid()) OR
    -- User is an officer/admin (can see internal comments)
    auth.uid() IN (
      SELECT id FROM public.profiles 
      WHERE role IN ('l1_officer', 'l2_officer', 'admin')
    ) OR
    -- User created the comment
    user_id = auth.uid()
  );

CREATE POLICY "Users can create comments" ON public.issue_comments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND (
      -- User is reporter or assigned officer
      issue_id IN (
        SELECT id FROM public.issues 
        WHERE reporter_id = auth.uid() 
        OR assigned_l1_id = auth.uid() 
        OR assigned_l2_id = auth.uid()
      ) OR
      -- User is officer/admin
      auth.uid() IN (
        SELECT id FROM public.profiles 
        WHERE role IN ('l1_officer', 'l2_officer', 'admin')
      )
    )
  );

-- Activity log policies (read-only for officers/admins)
CREATE POLICY "Officers and admins can view activity log" ON public.activity_log
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM public.profiles 
      WHERE role IN ('l1_officer', 'l2_officer', 'admin')
    )
  );

CREATE POLICY "System can insert activity log" ON public.activity_log
  FOR INSERT WITH CHECK (true);
