import React from 'react';
import { TrackedAction, useTracker } from '@/hooks/useTracker'; // We might need to pass untrack from parent or use hook here if inside provider
import { ChannelStatistics } from '@/lib/youtube';
import styles from './StatsDashboard.module.css'; // We might need new styles or use inline/tailwind

interface TrackerTableProps {
    actions: TrackedAction[];
    currentStats: ChannelStatistics;
    onUntrack: (id: string) => void;
    getImpact: (id: string, currentStats: ChannelStatistics) => { viewGrowth: number, subGrowth: number, daysSince: number } | null;
}

export const TrackerTable = ({ actions, currentStats, onUntrack, getImpact }: TrackerTableProps) => {
    if (actions.length === 0) return null;

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString('es-MX', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="overflow-x-auto rounded-xl border border-gray-800 bg-[#0a0a0a]">
            <table className="w-full text-left text-sm text-gray-400">
                <thead className="bg-[#111] text-gray-200 uppercase text-xs">
                    <tr>
                        <th className="px-6 py-4">Video Vinculado</th>
                        <th className="px-6 py-4">Estrategia / Acción</th>
                        <th className="px-6 py-4">Estado</th>
                        <th className="px-6 py-4">Impacto</th>
                        <th className="px-6 py-4">Fecha</th>
                        <th className="px-6 py-4 text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                    {actions.map((action) => {
                        const impact = getImpact(action.id, currentStats);
                        return (
                            <tr key={action.id} className="hover:bg-[#151515] transition-colors">
                                <td className="px-6 py-4 font-medium text-white">
                                    {action.videoTitle ? (
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">📺</span>
                                            <span className="truncate max-w-[200px]" title={action.videoTitle}>
                                                {action.videoTitle}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-gray-600 italic">-- General --</span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <span className="font-semibold text-blue-300">{action.title}</span>
                                </td>
                                <td className="px-6 py-4">
                                    {action.verificationStatus === 'verified' && (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-900/30 text-green-400 text-xs border border-green-800">
                                            ✅ Verificado
                                        </span>
                                    )}
                                    {action.verificationStatus === 'failed' && (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-900/30 text-red-400 text-xs border border-red-800">
                                            ❌ Sin cambios
                                        </span>
                                    )}
                                    {action.verificationStatus === 'pending' && (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-900/30 text-yellow-400 text-xs border border-yellow-800">
                                            ⏳ Pendiente
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    {impact ? (
                                        <div className="flex flex-col gap-1 text-xs">
                                            <span className={impact.viewGrowth > 0 ? 'text-green-400' : 'text-gray-500'}>
                                                {impact.viewGrowth > 0 ? '+' : ''}{impact.viewGrowth.toLocaleString()} Vistas
                                            </span>
                                            <span className={impact.subGrowth > 0 ? 'text-blue-400' : 'text-gray-500'}>
                                                {impact.subGrowth > 0 ? '+' : ''}{impact.subGrowth} Subs
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-gray-600">-</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-xs font-mono">
                                    {formatDate(action.implementedAt)}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => {
                                            if (confirm('¿Desvincular esta acción?')) onUntrack(action.id);
                                        }}
                                        className="text-red-500 hover:text-red-300 hover:bg-red-900/20 px-3 py-1 rounded transition-all text-xs font-medium"
                                    >
                                        Desvincular
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};
