import React from 'react';
import { ClientUnit } from '../types';
import { MailCommandCenterView } from './MailCommandCenterView';

interface GrandArchiveViewProps {
  units: ClientUnit[];
  activeUnit: ClientUnit | null;
  onSelectUnit: (id: string) => void;
  onNavigateToDashboard: () => void;
  onLogTerminal: (message: string, type?: 'normal' | 'action' | 'server' | 'alert') => void;
}

export const GrandArchiveView: React.FC<GrandArchiveViewProps> = (props) => {
  return <MailCommandCenterView {...props} />;
};
