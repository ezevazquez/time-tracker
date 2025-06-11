export interface Client {
    id: string
    name: string
    description: string | null
    created_at: string
  }
  
  export interface ClientContact {
    id: string
    client_id: string
    name: string
    email: string | null
    phone: string | null
    position: string | null
  }
  