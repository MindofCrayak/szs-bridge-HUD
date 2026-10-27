import React, { useState, useCallback } from 'react';
import { SERVICE_REGISTRY } from '../../data/serviceRegistry';
import { ServiceComponent } from '../../types';

interface ServiceDraggerProps {
  activeComponents?: string[];
  onToggleComponent?: (componentId: string) => void;
  onAttachComponent?: (component: ServiceComponent) => void;
}

/**
 * ServiceDragger: Canvas-side drop target for ECS Service Nodes.
 *
 * When a Service Node pill is dragged from the MultiAgentDispatch sidebar
 * and dropped here, it reads the `serviceId` from the drag payload,
 * resolves it against SERVICE_REGISTRY, and fires `onAttachComponent`.
 *
 * Also provides a manual toggle fallback for attaching/detaching services
 * from the currently active client's workbench.
 */
export const ServiceDragger: React.FC<ServiceDraggerProps> = ({
  activeComponents = [],
  onToggleComponent,
  onAttachComponent,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isDragOver, setIsDragOver] = useState(false);

  const categories = ['ALL', 'INFRA', 'LEGAL', 'AI', 'DELIVERY', 'GROWTH'];

  const filtered = selectedCategory === 'ALL'
    ? SERVICE_REGISTRY
    : SERVICE_REGISTRY.filter((s) => s.category === selectedCategory);

  /** Handle drag-over to show visual snap indicator */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  /** Handle drop: resolve serviceId from payload and fire attach */
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const serviceId = e.dataTransfer.getData('serviceId') || e.dataTransfer.getData('text/plain');
    if (!serviceId) return;

    const service = SERVICE_REGISTRY.find((s) => s.id === serviceId);
    if (service) {
      onToggleComponent?.(service.id);
      onAttachComponent?.(service);
    }
  }, [onToggleComponent, onAttachComponent]);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`w-[310px] rounded-xl border bg-[#020500]/95 backdrop-blur-md p-3 text-[#DDFBD0] shadow-[0_8px_32px_rgba(0,0,0,0.85)] font-mono select-none flex flex-col max-h-[460px] transition-all duration-200 ${
        isDragOver
          ? 'border-[#E0CA3C] ring-2 ring-[#E0CA3C]/40 shadow-[0_0_24px_rgba(224,202,60,0.3)]'
          : 'border-[#086375]/70'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#086375]/60 pb-2 mb-2">
        <div className="flex items-center gap-1.5">
          <i className="fa-solid fa-puzzle-piece text-[#E0CA3C] text-xs" />
          <h3 className="font-display font-bold text-xs tracking-wider text-[#E0CA3C]">
            ECS SERVICE REGISTRY
          </h3>
        </div>
        <span className="text-[0.6rem] px-1.5 py-0.5 rounded bg-[#086375]/30 text-[#DDFBD0]/70">
          PLUG & PLAY
        </span>
      </div>

      {/* Drop Zone Visual Indicator */}
      {isDragOver && (
        <div className="mb-2 p-2 border-2 border-dashed border-[#E0CA3C] rounded-lg text-center animate-pulse">
          <span className="text-[0.65rem] text-[#E0CA3C] font-bold">
            ⬇ DROP TO SNAP SERVICE TO CORE NODE
          </span>
        </div>
      )}

      {/* Category Pills */}
      <div className="flex gap-1 overflow-x-auto pb-1 mb-2 custom-scrollbar text-[0.58rem]">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-2 py-0.5 rounded font-bold transition-colors cursor-pointer shrink-0 ${
              selectedCategory === cat
                ? 'bg-[#E0CA3C] text-black'
                : 'bg-[#086375]/20 text-[#DDFBD0]/70 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Services List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar min-h-0">
        {filtered.map((service) => {
          const isInstalled = activeComponents.includes(service.id);
          return (
            <div
              key={service.id}
              className={`p-2 rounded-lg border transition-all ${
                isInstalled
                  ? 'border-[#E0CA3C] bg-[#E0CA3C]/10 shadow-[0_0_12px_rgba(224,202,60,0.2)]'
                  : 'border-[#086375]/50 bg-[#0d1513]/70 hover:border-[#086375]'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="font-bold text-[0.68rem] text-white truncate">
                  {service.name}
                </span>
                <span className="text-[0.62rem] font-bold text-[#E0CA3C] shrink-0">
                  +${service.price.toLocaleString()}
                </span>
              </div>
              <p className="text-[0.58rem] text-[#DDFBD0]/65 line-clamp-2 mb-2 leading-relaxed">
                {service.description}
              </p>

              {/* Tasks to inject preview */}
              <div className="mb-2 text-[0.54rem] text-[#086375] font-semibold space-y-0.5 border-t border-[#086375]/30 pt-1">
                <span className="text-[#DDFBD0]/40 uppercase tracking-widest block text-[0.5rem]">
                  Injects {service.tasksToInject.length} tasks:
                </span>
                {service.tasksToInject.slice(0, 2).map((t, i) => (
                  <div key={i} className="truncate">
                    • {t}
                  </div>
                ))}
              </div>

              {/* Action Toggle */}
              <button
                type="button"
                onClick={() => {
                  onToggleComponent?.(service.id);
                  onAttachComponent?.(service);
                }}
                className={`w-full py-1 rounded text-[0.6rem] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  isInstalled
                    ? 'border border-[#FE5F00] bg-[#FE5F00]/20 text-[#FE5F00] hover:bg-[#FE5F00] hover:text-black'
                    : 'border border-[#E0CA3C] bg-[#E0CA3C]/15 text-[#E0CA3C] hover:bg-[#E0CA3C] hover:text-black'
                }`}
              >
                <i className={`fa-solid ${isInstalled ? 'fa-circle-xmark' : 'fa-plus'}`} />
                <span>{isInstalled ? 'DETACH SERVICE' : 'ATTACH SERVICE TEMPLATE'}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
