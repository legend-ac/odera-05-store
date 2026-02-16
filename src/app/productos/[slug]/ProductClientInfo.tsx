'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useCart } from '@/contexts/CartContext';
import { formatCurrency } from '@/lib/utils/formatters';

interface ProductClientInfoProps {
    product: any;
}

export default function ProductClientInfo({ product }: ProductClientInfoProps) {
    const { addItem } = useCart();
    const [selectedImage, setSelectedImage] = useState(0);
    const [selectedVariant, setSelectedVariant] = useState(
        product.variants?.find((v: any) => v.stock > 0) || product.variants?.[0] || null
    );
    const [quantity, setQuantity] = useState(1);
    const [addingToCart, setAddingToCart] = useState(false);

    const images = product.images && product.images.length > 0
        ? product.images
        : product.coverImageUrl
            ? [product.coverImageUrl]
            : [];

    const displayPrice = product.onSale && product.salePrice
        ? product.salePrice
        : product.price;

    const hasDiscount = product.onSale && product.salePrice && product.salePrice < product.price;

    const handleAddToCart = () => {
        if (!selectedVariant || selectedVariant.stock === 0) return;

        setAddingToCart(true);
        try {
            addItem(product, selectedVariant, quantity);
            alert('✓ Producto agregado al carrito');
        } catch (error) {
            alert('Error al agregar al carrito');
        } finally {
            setAddingToCart(false);
        }
    };

    return (
        <div className="grid md:grid-cols-2 gap-8">
            {/* Galería de Imágenes */}
            <div>
                <div className="bg-white rounded-lg overflow-hidden mb-4 border">
                    <div className="relative aspect-square">
                        {images.length > 0 ? (
                            <Image
                                src={images[selectedImage]}
                                alt={product.name}
                                fill
                                className="object-cover"
                                priority
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                                <div className="text-center">
                                    <div className="text-6xl mb-2">📦</div>
                                    <p>ODERA 05</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Thumbnails */}
                {images.length > 1 && (
                    <div className="grid grid-cols-4 gap-2">
                        {images.map((img: string, idx: number) => (
                            <button
                                key={idx}
                                onClick={() => setSelectedImage(idx)}
                                className={`relative aspect-square rounded-lg overflow-hidden border-2 transition ${selectedImage === idx ? 'border-black' : 'border-gray-200 hover:border-gray-400'
                                    }`}
                            >
                                <Image
                                    src={img}
                                    alt={`${product.name} ${idx + 1}`}
                                    fill
                                    className="object-cover"
                                />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Información del Producto */}
            <div>
                <div className="bg-white rounded-lg p-6 border">
                    {/* Brand */}
                    {product.brand && (
                        <p className="text-sm text-gray-500 uppercase tracking-wide mb-2">
                            {product.brand}
                        </p>
                    )}

                    {/* Nombre */}
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                        {product.name}
                    </h1>

                    {/* Precio */}
                    <div className="flex items-baseline gap-3 mb-6">
                        <span className="text-4xl font-bold text-gray-900">
                            {formatCurrency(displayPrice)}
                        </span>
                        {hasDiscount && (
                            <>
                                <span className="text-xl text-gray-500 line-through">
                                    {formatCurrency(product.price)}
                                </span>
                                <span className="bg-red-600 text-white text-sm font-bold px-2 py-1 rounded">
                                    {Math.round(((product.price - product.salePrice!) / product.price) * 100)}% OFF
                                </span>
                            </>
                        )}
                    </div>

                    {/* Descripción */}
                    {product.description && (
                        <div className="mb-6">
                            <h3 className="font-semibold text-gray-900 mb-2">Descripción</h3>
                            <p className="text-gray-600 whitespace-pre-line">{product.description}</p>
                        </div>
                    )}

                    {/* Selector Variantes */}
                    {product.variants && product.variants.length > 0 && (
                        <div className="mb-6">
                            <h3 className="font-semibold text-gray-900 mb-3">
                                Selecciona {product.variants[0].size ? 'Talla' : 'Variante'}
                            </h3>
                            <div className="grid grid-cols-4 gap-2">
                                {product.variants.map((variant: any) => (
                                    <button
                                        key={variant.id}
                                        onClick={() => {
                                            setSelectedVariant(variant);
                                            setQuantity(1);
                                        }}
                                        disabled={variant.stock === 0}
                                        className={`p-3 rounded-lg border-2 font-medium transition ${selectedVariant?.id === variant.id
                                                ? 'border-black bg-black text-white'
                                                : variant.stock === 0
                                                    ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                                                    : 'border-gray-300 hover:border-black'
                                            }`}
                                    >
                                        {variant.size || variant.color || variant.id}
                                        {variant.stock === 0 && (
                                            <div className="text-xs mt-1">Agotado</div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Selector Cantidad */}
                    {selectedVariant && selectedVariant.stock > 0 && (
                        <div className="mb-6">
                            <h3 className="font-semibold text-gray-900 mb-3">Cantidad</h3>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition font-bold text-xl"
                                >
                                    −
                                </button>
                                <span className="text-xl font-semibold w-12 text-center">{quantity}</span>
                                <button
                                    onClick={() => setQuantity(Math.min(selectedVariant.stock, quantity + 1))}
                                    disabled={quantity >= selectedVariant.stock}
                                    className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition disabled:opacity-50 font-bold text-xl"
                                >
                                    +
                                </button>
                                <span className="text-sm text-gray-600 ml-2">
                                    {selectedVariant.stock} disponible{selectedVariant.stock !== 1 ? 's' : ''}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Botón Agregar al Carrito */}
                    <button
                        onClick={handleAddToCart}
                        disabled={!selectedVariant || selectedVariant.stock === 0 || addingToCart}
                        className="w-full bg-black text-white py-4 rounded-lg font-bold text-lg hover:bg-gray-800 transition disabled:bg-gray-300 disabled:cursor-not-allowed mb-3"
                    >
                        {addingToCart
                            ? 'Agregando...'
                            : !selectedVariant
                                ? 'Selecciona una variante'
                                : selectedVariant.stock === 0
                                    ? 'Agotado'
                                    : 'Agregar al Carrito'}
                    </button>

                    {/* WhatsApp Consulta */}
                    <a
                        href={`https://wa.me/51916305297?text=${encodeURIComponent(`Hola, estoy interesado en ${product.name}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full bg-green-600 text-white py-3 rounded-lg font-medium text-center hover:bg-green-700 transition"
                    >
                        <span className="flex items-center justify-center gap-2">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                            Consultar por WhatsApp
                        </span>
                    </a>
                </div>
            </div>
        </div>
    );
}
