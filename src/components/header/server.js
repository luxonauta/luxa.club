import { getSession } from "@/utils/supabase/actions";
import ClientHeader from "./client";

const ServerHeader = async () => {
  const session = await getSession();

  return <ClientHeader session={session} />;
};

export default ServerHeader;
