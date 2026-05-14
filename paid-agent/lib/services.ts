export interface Service {
  id: string
  name: string
  description: string
  price: string
  priceDisplay: string
  category: string
}

export const SERVICES: Service[] = [
  {
    id: 'market-data',
    name: 'Real-time Market Data',
    description: 'Live cryptocurrency prices and 24h change from CoinGecko',
    price: '1',
    priceDisplay: '$1',
    category: 'Finance',
  },
  {
    id: 'weather',
    name: 'Weather Intelligence',
    description: 'Hyperlocal weather forecasts powered by Open-Meteo',
    price: '1',
    priceDisplay: '$1',
    category: 'Data',
  },
  {
    id: 'ai-text',
    name: 'AI Text Generation',
    description: 'Intelligent text generation about web3 and agentic payments',
    price: '1',
    priceDisplay: '$1',
    category: 'AI',
  },
  {
    id: 'translate',
    name: 'Language Translation',
    description: 'High-accuracy translation powered by Groq llama-3.1-8b-instant',
    price: '1',
    priceDisplay: '$1',
    category: 'AI',
  },
  {
    id: 'code-review',
    name: 'AI Code Review',
    description: 'Automated code quality analysis with OWASP security checks',
    price: '1',
    priceDisplay: '$1',
    category: 'Development',
  },
  {
    id: 'sentiment',
    name: 'Sentiment Analysis',
    description: 'Deep sentiment scoring with entity-level analysis',
    price: '1',
    priceDisplay: '$1',
    category: 'AI',
  },
]
