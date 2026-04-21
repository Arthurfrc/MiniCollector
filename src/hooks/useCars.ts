// src/hooks/useCars.ts

import { useState, useEffect, useCallback } from 'react';
import { Car } from '@/types/Car';
import * as repo from '@/database/carRepository';

export function useCars() {
    const [cars, setCars] = useState<Car[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        const data = await repo.getAllCars();
        setCars(data);
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    const addCar = async (car: Omit<Car, 'id'>) => {
        const newCar = await repo.insertCar(car);
        setCars(prev => [newCar, ...prev]);
        return newCar;
    };

    const editCar = async (car: Car) => {
        await repo.updateCar(car);
        setCars(prev => prev.map(c => c.id === car.id ? car : c));
    };

    const removeCar = async (id: string) => {
        await repo.deleteCar(id);
        setCars(prev => prev.filter(c => c.id !== id));
    };

    const search = async (query: string) => {
        if (!query.trim()) return load();
        setLoading(true);
        const data = await repo.searchCars(query);
        setCars(data);
        setLoading(false);
    };

    return { cars, loading, reload: load, addCar, editCar, removeCar, search };
}