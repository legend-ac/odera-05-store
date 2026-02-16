import { Metadata } from 'next';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { Header } from '@/components/Header';
import ProductClientInfo from './ProductClientInfo';

// SEO Dinámico (OpenGraph para WhatsApp/Instagram)
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
    try {
        const q = query(
            collection(db, 'products'),
            where('slug', '==', params.slug),
            where('status', '==', 'active'),
            limit(1)
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            return { title: 'Producto no encontrado | ODERA 05' };
        }

        const product = snapshot.docs[0].data();
        const price = product.onSale && product.salePrice ? product.salePrice : product.price;
        const imageUrl = product.coverImageUrl || (product.images?.[0] || '');

        return {
            title: `${product.name} | ODERA 05 STORE`,
            description: product.description?.substring(0, 150) + '...' || `${product.name} disponible en ODERA 05`,
            openGraph: {
                images: imageUrl ? [imageUrl] : [],
                title: `${product.name} - S/ ${price}`,
                description: product.description?.substring(0, 150),
                siteName: 'ODERA 05 STORE',
            },
            twitter: {
                card: 'summary_large_image',
                title: `${product.name} - S/ ${price}`,
                images: imageUrl ? [imageUrl] : [],
            },
        };
    } catch (error) {
        console.error('Error generating metadata:', error);
        return { title: 'ODERA 05 STORE' };
    }
}

// Componente Servidor
export default async function ProductPage({ params }: { params: { slug: string } }) {
    const q = query(
        collection(db, 'products'),
        where('slug', '==', params.slug),
        where('status', '==', 'active'),
        limit(1)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        return (
            <>
                <Header />
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-6xl mb-4">📦</div>
                        <h1 className="text-2xl font-bold text-gray-900">Producto no encontrado</h1>
                        <a href="/productos" className="text-primary hover:underline mt-4 inline-block">
                            Volver a productos
                        </a>
                    </div>
                </div>
            </>
        );
    }

    const product = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };

    return (
        <>
            <Header />
            <div className="min-h-screen bg-gray-50">
                <div className="container mx-auto px-4 py-8">
                    <ProductClientInfo product={product} />
                </div>
            </div>
        </>
    );
}
