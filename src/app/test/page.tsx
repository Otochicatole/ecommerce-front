'use client';
import { Wallet, initMercadoPago } from "@mercadopago/sdk-react";
import axios, { AxiosError } from "axios";
import { useEffect, useState } from "react"

export default function TestPage() {
    const [preferenceId, setPreferenceId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const publicKey = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY;
        initMercadoPago(publicKey as string);
        console.log(publicKey);
    }, []);


    const getPreference = async () => {
        setLoading(true);
        try {
            const product = {
                id: "SKU-TEST-001",
                title: "Zapatillas Negras",
                quantity: 1,
                unit_price: 100,
                currency_id: "ARS",
            };
            const { data } = await axios.post("/api/payments/mp/preference", { product });
            if (data?.preferenceId) setPreferenceId(data.preferenceId);
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                const axErr = err as AxiosError;
                if (axErr.response) {
                    console.error("Axios response error", axErr.response.status, axErr.response.data);
                } else if (axErr.request) {
                    console.error("Axios request error", axErr.message);
                } else {
                    console.error("Axios config error", axErr.message);
                }
            } else {
                console.error("Unexpected error", err);
            }
        } finally {
            setLoading(false);
        }
      };
    
      return (
        <div className="space-y-3">
          {!preferenceId ? (
            <button onClick={getPreference} disabled={loading} className="btn-primary">
              {loading ? "Preparando..." : "Pagar con Mercado Pago"}
            </button>
          ) : (
            <Wallet initialization={{ preferenceId, redirectMode: "self" }} />
          )}
        </div>
    )
}