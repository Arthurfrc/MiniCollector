// src/types/Car.ts

export type Condition = 'mint' | 'excellent' | 'good' | 'fair' | 'poor';

export interface Car {
    id: string;
    name: string;           // Nome do carro
    brand: string;          // Marca
    manufacture: string;    // Fabricante
    year: number;           // Ano
    scale: string;          // Escala
    condition: Condition;
    purchasePrice?: number;
    currentValue?: number;
    purchaseDate?: string;
    notes?: string;
    imageUri?: string;
    thumbnailUri?: string;
    lastUpdate?: string;
    color?: string;
    baseColor?: string;
    serie?: string;
    country?: string;
    baseCode?: string;
    cardSeriesNumber?: string;
    cardCollectionNumber?: string;
    cardSeriesName?: string;
}

export interface WikiCarData {
    name: string;
    brand?: string;
    year?: number;
    baseColor?: string;
    serie?: string;
    baseCode?: string;
    cardSeriesNumber?: string;
    cardCollectionNumber?: string;
    cardSeriesName?: string;
    country?: string;
    pageUrl?: string;
    thumbnailUrl?: string;
}