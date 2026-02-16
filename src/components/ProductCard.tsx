'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/types';
import { formatCurrency } from '@/lib/utils/formatters';

interface ProductCardProps {
    product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
    const displayPrice = product.onSale && product.salePrice
        ? product.salePrice
        : product.price;

    const hasDiscount = product.onSale && product.salePrice && product.salePrice < product.price;

    return (
        <Link
            href={`/productos/${product.slug}`}
            className="group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow"
        >
            {/* Image */}
            <div className="relative aspect-[4/5] bg-gray-100">
                {product.coverImageUrl ? (
                    <Image
                        src={product.coverImageUrl}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <div className="text-center">
                            <div className="text-4xl mb-2">📦</div>
                            <p className="text-sm">ODERA 05</p>
                        </div>
                    </div>
                )}

                {/* Badges */}
                <div className="absolute top-3 right-3 flex flex-col gap-2">
                    {product.isNew && (
                        <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">
                            NUEVO
                        </span>
                    )}
                    {hasDiscount && (
                        <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                            {Math.round(((product.price - product.salePrice!) / product.price) * 100)}% OFF
                        </span>
                    )}
                </div>

                {/* Stock badge */}
                {product.totalStock === 0 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="bg-gray-900 text-white px-4 py-2 rounded-lg font-semibold">
                            AGOTADO
                        </span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-4">
                {/* Brand */}
                {product.brand && (
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                        {product.brand}
                    </p>
                )}

                {/* Name */}
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary transition">
                    {product.name}
                </h3>

                {/* Price */}
                <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold text-gray-900">
                        {formatCurrency(displayPrice)}
                    </span>
                    {hasDiscount && (
                        <span className="text-sm text-gray-500 line-through">
                            {formatCurrency(product.price)}
                        </span>
                    )}
                </div>

                {/* Stock info */}
                {product.totalStock > 0 && product.totalStock <= 5 && (
                    <p className="text-xs text-orange-600 mt-2">
                        ⚠️ ¡Solo quedan {product.totalStock}!
                    </p>
                )}
            </div>
        </Link>
    );
}
