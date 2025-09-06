
import React from 'react';
import Sidebar from './Sidebar';
import MobileNavBar from './MobileNavBar';
import MobileHeader from './MobileHeader';
import { useIsMobile } from '@/hooks/use-mobile';
import WhatsAppActivationButton from '@/components/common/WhatsAppActivationButton';

import { useAppContext } from '@/contexts/AppContext';

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
  onAddTransaction?: (type: 'income' | 'expense') => void;
  onProfileClick?: () => void;
  onConfigClick?: () => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  title,
  onAddTransaction,
  onProfileClick,
  onConfigClick
}) => {
  const isMobile = useIsMobile();
  const { hideValues, toggleHideValues } = useAppContext();
  
  const handleAddTransaction = (type: 'income' | 'expense') => {
    if (onAddTransaction) {
      onAddTransaction(type);
    } else {
      console.log(`Add ${type} transaction`);
    }
  };
  
  return <div className="bg-background w-full">
      {isMobile ? <div className="flex flex-col min-h-screen w-full">
          <MobileHeader hideValues={hideValues} toggleHideValues={toggleHideValues} />
          <main className="flex-1 overflow-y-auto p-4 pb-20 pt-20 w-full">
            {title && <div className="mb-6">
                
              </div>}
            {children}
          </main>
          <MobileNavBar onAddTransaction={handleAddTransaction} />
        </div> : <div className="flex h-screen w-full overflow-hidden">
          <Sidebar onProfileClick={onProfileClick} onConfigClick={onConfigClick} />
          <main className="flex-1 overflow-auto w-full min-w-0">
            <div className="w-full p-4 lg:p-6 max-w-full">
              {title && <div className="mb-6">
                  
                </div>}
              {children}
            </div>
          </main>
        </div>}
      
      {/* WhatsApp Floating Button */}
      <WhatsAppActivationButton />
    </div>;
};

export default MainLayout;
