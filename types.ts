
export enum OrderStatus {
  ORCAMENTO = 'Orçamento',
  PENDENTE_50 = '50% Pendente',
  PENDENTE_100 = '100% Pendente',
  PAGO_100 = '100% Pago',
  FINALIZADO = 'Finalizado'
}

export enum ProductionStage {
  PRE_PREPARO = 'Pré-preparo',
  PRODUCAO = 'Produção',
  SECAGEM = 'Secagem',
  EMBALAGEM = 'Embalagem',
  PRONTO = 'Pronto para Entrega'
}

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  details: string; // e.g., "Sem glúten", "Nome: João"
  measureUnit?: 'un' | 'kg' | 'g';
}

export interface Customer {
  id: string;
  name: string;
  whatsapp: string;
  address?: string;
  birthdayPersonName?: string;
  birthdayPersonAge?: number;
  lastOrderDate?: string;
}

export interface Order {
  id: string;
  customerName: string;
  customerWhatsapp: string;
  
  // Novos campos solicitados
  birthdayPersonName?: string; // Nome do aniversariante
  birthdayPersonAge?: number;  // Idade do aniversariante
  
  partyType: string; // e.g., Aniversário, Casamento
  theme: string; // e.g., Frozen, Harry Potter
  items: OrderItem[];
  dueDate: string; // ISO Date string
  dueTime: string;
  location: string;
  deliveryFee?: number; // Taxa de entrega
  discount?: number; // Desconto
  totalPrice: number;
  // clientBudget removido conforme solicitação
  status: OrderStatus;
  productionStage: ProductionStage;
  notes?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string; // Added for catalog details
  basePrice: number;
  costPrice: number; // For profit calc
  imageUrl: string;
  category: string; // Pirulito, Pão de Mel, Donut
  productionTimeMinutes: number;
  measureUnit: 'un' | 'kg' | 'g';
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string; // kg, un, l
  minStock: number;
  supplierName?: string;
  supplierPhone?: string;
  lastRestocked?: string;
}

export interface Transaction {
  id: string;
  date: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  description: string;
  category: string;
  orderId?: string; // Link to order for auto-sync
}

export interface ThemeInspiration {
  id: string;
  themeName: string;
  colors: string[];
  imageUrl: string;
  notes: string;
}
