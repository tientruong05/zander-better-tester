'use client';

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface OrderStatusStepperProps {
  status: string;
  createdAt: string;
  updatedAt?: string;
  paidAt?: string;
  paymentMethod?: string;
}

const OrderStatusStepper: React.FC<OrderStatusStepperProps> = ({ status, createdAt, updatedAt, paidAt, paymentMethod }) => {
  const { t } = useLanguage();

  const steps = [
    {
      id: 'placed',
      label: t('order_stepper.order_placed'),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
        </svg>
      ),
      date: createdAt,
      isActive: true, // Always active if order exists
    },
    {
      id: 'paid',
      label: t('order_stepper.paid'),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
        </svg>
      ),
      date: paidAt || updatedAt,
      isActive: ['paid', 'processing', 'shipping', 'completed', 'delivered'].includes(status),
    },
    {
      id: 'processing',
      label: t('order_stepper.processing'),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
        </svg>
      ),
      date: ['processing', 'shipping', 'completed', 'delivered'].includes(status) ? updatedAt : undefined,
      isActive: ['processing', 'shipping', 'completed', 'delivered'].includes(status),
    },
    {
      id: 'shipping',
      label: t('order_stepper.shipping'),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.126-.504 1.126-1.125V15.75m-6-3.75h3.75m0 0v1.5m0-1.5h-1.5m-6 0H3.375a1.125 1.125 0 0 0-1.125 1.125v3.375m19.5-3.375V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v9" />
        </svg>
      ),
      date: ['shipping', 'completed', 'delivered'].includes(status) ? updatedAt : undefined,
      isActive: ['shipping', 'completed', 'delivered'].includes(status),
    },
    {
      id: 'completed',
      label: t('order_stepper.completed'),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      ),
      date: ['completed', 'delivered'].includes(status) ? updatedAt : undefined,
      isActive: ['completed', 'delivered'].includes(status),
    },
  ];

  if (paymentMethod === 'cash') {
    // For cash payments, the paid step happens at the very end
    const paidStepIndex = steps.findIndex(s => s.id === 'paid');
    if (paidStepIndex !== -1) {
      const paidStep = steps.splice(paidStepIndex, 1)[0];
      // It's only paid if the status is completed/delivered
      paidStep.isActive = ['completed', 'delivered'].includes(status);
      paidStep.date = paidStep.isActive ? updatedAt : undefined;
      steps.push(paidStep);
    }
  }

    return (
    <div data-testid="order-status-stepper" className="w-full py-6 px-2 overflow-x-auto">
      <div className="flex items-start justify-between min-w-[500px]">
        {steps.map((step, index) => {
          const isCompleted = step.isActive;
          const isCurrent = steps[index].isActive && !steps[index + 1]?.isActive;
          const isLast = index === steps.length - 1;

          return (
            <React.Fragment key={step.id}>
              {/* Step Circle & Desktop Label Container */}
              <div
                data-testid={`order-status-step-${step.id}`}
                data-active={isCompleted ? "true" : "false"}
                className="flex flex-col items-center relative z-10 w-[70px] sm:w-[90px] flex-shrink-0"
              >
                <div 
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border-4 transition-all duration-300 bg-white
                    ${isCompleted ? 'border-green-500 text-green-500' : 'border-gray-200 text-gray-300'}
                    ${isCurrent ? 'scale-110 shadow-lg ring-4 ring-green-50' : ''}
                  `}
                >
                  <div className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center">
                    {step.icon}
                  </div>
                </div>
                
                {/* Text Label */}
                <div className="mt-3 sm:mt-4 text-center w-full px-1">
                  <p className={`text-[10px] sm:text-xs font-semibold leading-snug break-words ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                    {step.label}
                  </p>
                  {step.date && isCompleted && (
                    <p className="text-[9px] sm:text-[10px] text-gray-500 mt-1 leading-tight">
                      {new Date(step.date.includes('Z') || step.date.includes('+') ? step.date : step.date + 'Z').toLocaleString('vi-VN', {
                        timeZone: 'Asia/Ho_Chi_Minh',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      <br/>
                      {new Date(step.date.includes('Z') || step.date.includes('+') ? step.date : step.date + 'Z').toLocaleString('vi-VN', {
                        timeZone: 'Asia/Ho_Chi_Minh',
                        day: '2-digit', 
                        month: '2-digit',
                        year: 'numeric'
                      })}
                    </p>
                  )}
                </div>
              </div>

              {/* Connecting Line (not for last item) */}
              {!isLast && (
                <div className="flex-1 flex items-center self-start h-10 sm:h-12">
                  <div className={`h-1 w-full rounded-full mx-1 sm:mx-2 transition-colors duration-500
                    ${steps[index + 1]?.isActive ? 'bg-green-500' : 'bg-gray-200'}
                  `}></div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default OrderStatusStepper;
