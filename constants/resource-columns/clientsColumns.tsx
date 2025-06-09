import { Client } from "@/lib/supabase";
import { ResourceColumn } from "@/types";

export const clientsColumns = [
  {
    title: "Name",
    render: (client: Client) => client.name,
  },
];
