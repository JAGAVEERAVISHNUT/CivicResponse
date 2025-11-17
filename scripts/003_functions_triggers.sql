-- Function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, phone)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'full_name', 'User'),
    COALESCE((new.raw_user_meta_data ->> 'role')::user_role, 'citizen'),
    new.raw_user_meta_data ->> 'phone'
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
END;
$$;

-- Trigger for auto-creating profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Triggers for updating timestamps
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_issues_updated_at
  BEFORE UPDATE ON public.issues
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Function to log activity
CREATE OR REPLACE FUNCTION public.log_issue_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.activity_log (issue_id, user_id, action, details)
    VALUES (NEW.id, NEW.reporter_id, 'issue_created', jsonb_build_object(
      'title', NEW.title,
      'category', NEW.category,
      'priority', NEW.priority
    ));
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != NEW.status THEN
      INSERT INTO public.activity_log (issue_id, user_id, action, details)
      VALUES (NEW.id, auth.uid(), 'status_changed', jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status
      ));
    END IF;
    
    IF OLD.assigned_l1_id IS DISTINCT FROM NEW.assigned_l1_id THEN
      INSERT INTO public.activity_log (issue_id, user_id, action, details)
      VALUES (NEW.id, auth.uid(), 'assigned_l1', jsonb_build_object(
        'officer_id', NEW.assigned_l1_id
      ));
    END IF;
    
    IF OLD.assigned_l2_id IS DISTINCT FROM NEW.assigned_l2_id THEN
      INSERT INTO public.activity_log (issue_id, user_id, action, details)
      VALUES (NEW.id, auth.uid(), 'assigned_l2', jsonb_build_object(
        'officer_id', NEW.assigned_l2_id
      ));
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger for logging activity
CREATE TRIGGER log_issue_activity_trigger
  AFTER INSERT OR UPDATE ON public.issues
  FOR EACH ROW
  EXECUTE FUNCTION public.log_issue_activity();

-- Function to calculate SLA deadline based on priority
CREATE OR REPLACE FUNCTION public.calculate_sla_deadline(p_priority issue_priority)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN CASE p_priority
    WHEN 'critical' THEN NOW() + INTERVAL '24 hours'
    WHEN 'high' THEN NOW() + INTERVAL '48 hours'
    WHEN 'medium' THEN NOW() + INTERVAL '5 days'
    WHEN 'low' THEN NOW() + INTERVAL '7 days'
  END;
END;
$$;

-- Trigger to auto-set SLA deadline on issue creation
CREATE OR REPLACE FUNCTION public.set_sla_deadline()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.sla_deadline IS NULL THEN
    NEW.sla_deadline := public.calculate_sla_deadline(NEW.priority);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_sla_deadline_trigger
  BEFORE INSERT ON public.issues
  FOR EACH ROW
  EXECUTE FUNCTION public.set_sla_deadline();
