'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

interface Message {
    id: string;
    message: string;
    sender_id: string;
    sender_name: string;
    created_at: string;
}

interface Order {
    id: string;
    status: string;
    products?: { name: string };
    buyer_id: string;
    product_id: string;
}

export default function OrderChat() {
    const router = useRouter();
    const params = useParams();
    const orderId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [order, setOrder] = useState<any>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [otherUser, setOtherUser] = useState<any>(null);
    const [messageText, setMessageText] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: authData } = await supabase.auth.getUser();
                if (!authData?.user) {
                    router.push('/login');
                    return;
                }

                // Get current user profile
                const { data: userRow } = await supabase
                    .from('users')
                    .select('id, full_name, role')
                    .eq('email', authData.user.email!.toLowerCase())
                    .single();

                if (!userRow) {
                    router.push('/login');
                    return;
                }

                setCurrentUser(userRow);

                // Get order details
                const { data: orderData } = await supabase
                    .from('orders')
                    .select('*, products(name)')
                    .eq('id', orderId)
                    .single();

                if (!orderData) {
                    setError('Order not found');
                    return;
                }

                // Check if user is part of this order (farmer or buyer)
                const { data: productData } = await supabase
                    .from('products')
                    .select('farmer_id')
                    .eq('id', orderData.product_id)
                    .single();

                const isFarmer = productData?.farmer_id === userRow.id;
                const isBuyer = orderData.buyer_id === userRow.id;

                if (!isFarmer && !isBuyer) {
                    setError('You do not have access to this chat');
                    return;
                }

                setOrder(orderData);

                // Get other user
                const otherUserId = isFarmer ? orderData.buyer_id : productData?.farmer_id;
                const { data: otherUserData } = await supabase
                    .from('users')
                    .select('id, full_name')
                    .eq('id', otherUserId)
                    .single();

                setOtherUser(otherUserData);

                // Fetch messages
                const { data: messagesData } = await supabase
                    .from('messages')
                    .select('*')
                    .eq('order_id', orderId)
                    .order('created_at', { ascending: true });

                const enrichedMessages = await Promise.all(
                    (messagesData || []).map(async (msg) => {
                        const { data: senderData } = await supabase
                            .from('users')
                            .select('full_name')
                            .eq('id', msg.sender_id)
                            .single();

                        return {
                            ...msg,
                            sender_name: senderData?.full_name || 'Unknown',
                        };
                    })
                );

                setMessages(enrichedMessages);
            } catch (err: any) {
                setError(err.message || 'Error loading chat');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (orderId) fetchData();
    }, [orderId, router]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!messageText.trim() || !currentUser || !otherUser) return;

        setIsSending(true);

        try {
            const { error: insertError } = await supabase.from('messages').insert({
                order_id: orderId,
                sender_id: currentUser.id,
                receiver_id: otherUser.id,
                message: messageText,
            });

            if (insertError) throw insertError;

            // Add message to local state
            setMessages([
                ...messages,
                {
                    id: Date.now().toString(),
                    message: messageText,
                    sender_id: currentUser.id,
                    sender_name: currentUser.full_name,
                    created_at: new Date().toISOString(),
                },
            ]);

            setMessageText('');
        } catch (err: any) {
            setError(err.message || 'Failed to send message');
        } finally {
            setIsSending(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <p className="text-gray-600">Loading chat...</p>
            </div>
        );
    }

    if (error || !order || !currentUser || !otherUser) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 mb-4">{error || 'Unable to load chat'}</p>
                    <button
                        onClick={() => router.back()}
                        className="px-6 py-2 bg-farmer-green text-white rounded-lg"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b shadow-sm">
                <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold">Order Chat</h1>
                        <p className="text-sm text-gray-600">
                            {order.products?.name} - Chatting with {otherUser.full_name}
                        </p>
                    </div>
                    <button
                        onClick={() => router.back()}
                        className="text-gray-600 hover:text-gray-900"
                    >
                        ✕
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 max-w-2xl w-full mx-auto px-4 py-6 overflow-y-auto">
                {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-400">
                        <p>No messages yet. Start the conversation!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.sender_id === currentUser.id ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-xs px-4 py-2 rounded-lg ${msg.sender_id === currentUser.id
                                        ? 'bg-farmer-green text-white'
                                        : 'bg-gray-200 text-gray-900'
                                        }`}
                                >
                                    <p className="text-xs font-semibold mb-1">{msg.sender_name}</p>
                                    <p className="break-words">{msg.message}</p>
                                    <p className="text-xs mt-1 opacity-70">
                                        {new Date(msg.created_at).toLocaleTimeString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Message Input */}
            <div className="bg-white border-t p-4">
                <form onSubmit={handleSendMessage} className="max-w-2xl mx-auto flex gap-2">
                    <input
                        type="text"
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-farmer-green focus:border-transparent"
                    />
                    <button
                        type="submit"
                        disabled={isSending || !messageText.trim()}
                        className="px-6 py-2 bg-farmer-green text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50"
                    >
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
}
