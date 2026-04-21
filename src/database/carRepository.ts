// src/database/carRepository.ts

import * as Crypto from 'expo-crypto';
import { getDatabase } from './schema';
import { Car } from '@/types/Car';

// Converte row do banco → objeto Car
function rowToCar(row: any): Car {
    return {
        id: row.id,
        name: row.name,
        brand: row.brand,
        manufacture: row.manufacture,
        year: row.year,
        scale: row.scale,
        condition: row.condition,
        purchasePrice: row.purchase_price ?? undefined,
        currentValue: row.current_value ?? undefined,
        purchaseDate: row.purchase_date ?? undefined,
        notes: row.notes ?? undefined,
        imageUri: row.image_uri ?? undefined,
        thumbnailUri: row.thumbnail_uri ?? undefined,
        lastUpdate: row.last_update ?? undefined,
        color: row.color ?? undefined,
        baseColor: row.base_color ?? undefined,
        serie: row.serie ?? undefined,
        country: row.country ?? undefined,
        baseCode: row.base_code ?? undefined,
        cardSeriesNumber: row.card_series_number ?? undefined,
        cardCollectionNumber: row.card_collection_number ?? undefined,
        cardSeriesName: row.card_series_name ?? undefined,
    };
}

export async function getAllCars(): Promise<Car[]> {
    const db = getDatabase();
    const rows = await db.getAllAsync<any>(
        'SELECT * FROM cars ORDER BY created_at DESC'
    );
    return rows.map(rowToCar);
}

export async function getCarById(id: string): Promise<Car | null> {
    const db = getDatabase();
    const row = await db.getFirstAsync<any>(
        'SELECT * FROM cars WHERE id = ?', [id]
    );
    return row ? rowToCar(row) : null;
}

export async function insertCar(car: Omit<Car, 'id'>): Promise<Car> {
    const db = getDatabase();
    const id = Crypto.randomUUID();
    const now = new Date().toISOString();

    await db.runAsync(
        `INSERT INTO cars (
      id, name, brand, manufacture, year, scale, condition,
      purchase_price, current_value, purchase_date, notes,
      image_uri, thumbnail_uri, last_update, color, base_color,
      serie, country, base_code, card_series_number,
      card_collection_number, card_series_name, created_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
            id, car.name, car.brand, car.manufacture, car.year, car.scale,
            car.condition, car.purchasePrice ?? null, car.currentValue ?? null,
            car.purchaseDate ?? null, car.notes ?? null,
            car.imageUri ?? null, car.thumbnailUri ?? null,
            now, car.color ?? null, car.baseColor ?? null,
            car.serie ?? null, car.country ?? null, car.baseCode ?? null,
            car.cardSeriesNumber ?? null, car.cardCollectionNumber ?? null,
            car.cardSeriesName ?? null, now,
        ]
    );

    return { ...car, id, lastUpdate: now };
}

export async function updateCar(car: Car): Promise<void> {
    const db = getDatabase();
    const now = new Date().toISOString();

    await db.runAsync(
        `UPDATE cars SET
      name=?, brand=?, manufacture=?, year=?, scale=?, condition=?,
      purchase_price=?, current_value=?, purchase_date=?, notes=?,
      image_uri=?, thumbnail_uri=?, last_update=?, color=?, base_color=?,
      serie=?, country=?, base_code=?, card_series_number=?,
      card_collection_number=?, card_series_name=?
    WHERE id=?`,
        [
            car.name, car.brand, car.manufacture, car.year, car.scale,
            car.condition, car.purchasePrice ?? null, car.currentValue ?? null,
            car.purchaseDate ?? null, car.notes ?? null,
            car.imageUri ?? null, car.thumbnailUri ?? null,
            now, car.color ?? null, car.baseColor ?? null,
            car.serie ?? null, car.country ?? null, car.baseCode ?? null,
            car.cardSeriesNumber ?? null, car.cardCollectionNumber ?? null,
            car.cardSeriesName ?? null, car.id,
        ]
    );
}

export async function deleteCar(id: string): Promise<void> {
    const db = getDatabase();
    await db.runAsync('DELETE FROM cars WHERE id = ?', [id]);
}

export async function searchCars(query: string): Promise<Car[]> {
    const db = getDatabase();
    const like = `%${query}%`;
    const rows = await db.getAllAsync<any>(
        `SELECT * FROM cars 
     WHERE name LIKE ? OR brand LIKE ? OR serie LIKE ? OR base_code LIKE ?
     ORDER BY created_at DESC`,
        [like, like, like, like]
    );
    return rows.map(rowToCar);
}

export async function getStats() {
    const db = getDatabase();

    const total = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM cars'
    );
    const totalValue = await db.getFirstAsync<{ sum: number }>(
        'SELECT SUM(current_value) as sum FROM cars'
    );
    const totalSpent = await db.getFirstAsync<{ sum: number }>(
        'SELECT SUM(purchase_price) as sum FROM cars'
    );
    const byCondition = await db.getAllAsync<{ condition: string; count: number }>(
        'SELECT condition, COUNT(*) as count FROM cars GROUP BY condition'
    );
    const byManufacture = await db.getAllAsync<{ manufacture: string; count: number }>(
        'SELECT manufacture, COUNT(*) as count FROM cars GROUP BY manufacture ORDER BY count DESC'
    );

    return {
        total: total?.count ?? 0,
        totalValue: totalValue?.sum ?? 0,
        totalSpent: totalSpent?.sum ?? 0,
        byCondition,
        byManufacture,
    };
}