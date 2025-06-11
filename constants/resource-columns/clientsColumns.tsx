import type { Client } from '@/types/client'

export const clientsColumns = [
  {
    title: 'Name',
    render: (client: Client) => client.name,
  },
]
