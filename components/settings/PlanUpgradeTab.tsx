"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, X, Loader2, CreditCard, AlertCircle, ArrowRight, Calendar, Zap, Crown, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import type { PublicPlan } from "@/lib/types";
import { fetchCurrentSubscription, QK, type CurrentSubscription } from "@/lib/queries";



export function PlanUpgradeTab() {
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState<PublicPlan | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch all available plans
  const { data: allPlans = [], isLoading: plansLoading } = useQuery<PublicPlan[]>({
    queryKey: ["public-plans"],
    queryFn: async () => {
      const response = await fetch("/api/public/plans");
      if (!response.ok) throw new Error("Failed to fetch plans");
      return response.json();
    },
    staleTime: 5 * 60_000,
  });


// Fetch current subscription
const { data: currentSubscription, isLoading: subscriptionLoading, refetch: refetchSubscription } = useQuery<CurrentSubscription>({
  queryKey: ["current-subscription"],
  queryFn: fetchCurrentSubscription,
  staleTime: 6000,
});

  // Upgrade mutation
  // In PlanUpgradeTab.tsx, update the mutation with proper types
interface UpgradeResponse {
  checkout_url?: string;
  success?: boolean;
  message?: string;
}

const upgradeMutation = useMutation<UpgradeResponse, Error, number>({
  mutationFn: async (planId: number) => {
    setIsProcessing(true);
    const response = await api.post("/salon-admin/api/subscription/upgrade", {
      plan_id: planId,
    });
    return response as UpgradeResponse;
  },
  onSuccess: (data) => {
    if (data.checkout_url) {
      window.location.href = data.checkout_url;
    } else if (data.success) {
      toast.success(data.message || "Plan updated successfully!");
      refetchSubscription();
      queryClient.invalidateQueries({ queryKey: ["plan-features"] });
      setSelectedPlan(null);
      setIsProcessing(false);
    }
  },
  onError: (error: Error) => {
    toast.error(error.message || "Failed to update plan");
    setIsProcessing(false);
  },
});

  const handleUpgrade = (plan: PublicPlan) => {
    if (!currentSubscription) return;
    
    const isSamePlan = plan.id === currentSubscription.planId;
    if (isSamePlan) {
      toast.info("This is already your current plan");
      return;
    }

    setSelectedPlan(plan);
  };

  const confirmUpgrade = () => {
    if (selectedPlan) {
      upgradeMutation.mutate(selectedPlan.id);
    }
  };

  const cancelUpgrade = () => {
    setSelectedPlan(null);
  };

  const isFree = (plan: PublicPlan) => plan.price_cents === 0;
  const getPriceDisplay = (plan: PublicPlan) => {
    if (isFree(plan)) return "Free";
    const price = (plan.price_cents / 100).toFixed(0);
    const cycle = plan.billing_cycle === "monthly" ? "/month" : "/year";
    return `$${price}${cycle}`;
  };

  const isCurrentPlan = (plan: PublicPlan) => {
    return currentSubscription?.planId === plan.id;
  };

  const isUpgrade = (plan: PublicPlan) => {
    if (!currentSubscription) return false;
    return plan.price_cents > currentSubscription.priceCents;
  };

  const isDowngrade = (plan: PublicPlan) => {
    if (!currentSubscription) return false;
    return plan.price_cents < currentSubscription.priceCents && plan.price_cents > 0;
  };

  const getPlanIcon = (planName: string) => {
    const name = planName.toLowerCase();
    if (name.includes('pro')) return <Zap size={20} />;
    if (name.includes('platinum') || name.includes('premium')) return <Crown size={20} />;
    return <Sparkles size={20} />;
  };

  if (plansLoading || subscriptionLoading) {
    return (
      <div style={styles.loadingContainer}>
        <Loader2 size={32} style={styles.spinner} />
        <p>Loading plan information...</p>
      </div>
    );
  }
const availablePlans = allPlans.filter(plan => !isCurrentPlan(plan));
  return (
    <div style={styles.container}>
      {/* Current Plan Card */}
      {currentSubscription && (
        <div style={styles.currentPlanCard}>
          <div style={styles.currentPlanHeader}>
            <div style={styles.currentPlanIcon}>
              {getPlanIcon(currentSubscription.planName)}
            </div>
            <div style={styles.currentPlanContent}>
              <div style={styles.currentPlanBadge}>Current Plan</div>
              <h3 style={styles.currentPlanName}>{currentSubscription.planName}</h3>
              <div style={styles.currentPlanPrice}>
                {currentSubscription.priceCents === 0 ? (
                  "Free"
                ) : (
                  <>
                    ${(currentSubscription.priceCents / 100).toFixed(0)}
                    <span style={styles.priceCycle}>
                      /{currentSubscription.billingCycle === "monthly" ? "month" : "year"}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div style={styles.currentPlanDetails}>
            <div style={styles.detailRow}>
              <span>Status:</span>
              <span style={currentSubscription.status === "active" ? styles.activeStatus : styles.inactiveStatus}>
                {currentSubscription.status === "active" ? "✅ Active" : "⚠️ Inactive"}
              </span>
            </div>
            
            {currentSubscription.remainingDaysText && currentSubscription.status === "active" && (
              <div style={styles.detailRow}>
                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Calendar size={12} /> Billing period:
                </span>
                <span style={styles.remainingDays}>
                  {currentSubscription.remainingDaysText}
                </span>
              </div>
            )}
            
            {currentSubscription.currentPeriodEnd && (
              <div style={styles.detailRow}>
                <span>Renews on:</span>
                <span>{new Date(currentSubscription.currentPeriodEnd).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          <div style={styles.featureGrid}>
            <FeatureBadge 
              active={currentSubscription.features.whatsappAccess}
              label="WhatsApp"
            />
            <FeatureBadge 
              active={currentSubscription.features.instagramAccess}
              label="Instagram"
            />
            <FeatureBadge 
              active={currentSubscription.features.facebookAccess}
              label="Facebook"
            />
            <FeatureBadge 
              active={currentSubscription.features.aiCallsAccess}
              label="AI Calls"
            />
            <FeatureBadge 
              active={currentSubscription.features.widgetAccess}
              label="Booking Widget"
            />
            <div style={styles.servicesCount}>
              📍 {currentSubscription.features.maxServices} services included
            </div>
          </div>
        </div>
      )}

      {/* Available Plans Section */}
      <div style={styles.plansSection}>
        <div style={styles.plansHeader}>
          <h4 style={styles.sectionTitle}>Available Plans</h4>
          <p style={styles.sectionDescription}>
            Choose the perfect plan for your salon. Upgrade anytime.
          </p>
        </div>

        <div style={styles.plansGrid}>
          {availablePlans.map((plan) => {
            const isCurrent = isCurrentPlan(plan);
            const upgrade = isUpgrade(plan);
            const downgrade = isDowngrade(plan);
            
            return (
              <div
                key={plan.id}
                style={{
                  ...styles.planCard,
                  ...(isCurrent && styles.currentPlanCardStyle),
                  ...(selectedPlan?.id === plan.id && styles.selectedPlanCard),
                }}
              >
                {plan.highlight && !isCurrent && (
                  <div style={styles.popularBadge}>Most Popular</div>
                )}
                
                {isCurrent && (
                  <div style={styles.activeBadge}>
                    <Check size={12} /> Active Plan
                  </div>
                )}
                
                <div style={styles.planHeader}>
                  <div style={styles.planIconWrapper}>
                    {getPlanIcon(plan.name)}
                  </div>
                  <div>
                    <h5 style={styles.planName}>{plan.name}</h5>
                    {plan.description && (
                      <p style={styles.planDescription}>{plan.description}</p>
                    )}
                  </div>
                </div>

                <div style={styles.planPriceContainer}>
                  <div style={styles.planPrice}>{getPriceDisplay(plan)}</div>
                </div>

                <div style={styles.planFeatures}>
                  <PlanFeature active={true} text={`Up to ${plan.max_services} services`} />
                  <PlanFeature active={!!plan.whatsapp_access} text="WhatsApp Booking" />
                  <PlanFeature active={!!plan.instagram_access} text="Instagram Booking" />
                  <PlanFeature active={!!plan.facebook_access} text="Facebook Booking" />
                  <PlanFeature active={!!plan.ai_calls_access} text="AI Voice Calls" />
                  <PlanFeature active={!!plan.widget_access} text="Website Widget" />
                </div>

                {isCurrent ? (
  <button style={styles.currentButton} disabled>
    <Check size={16} />
    Current Plan
    {currentSubscription?.remainingDaysText && (
      <span style={styles.currentButtonSubtext}>
        ({currentSubscription.remainingDaysText})
      </span>
    )}
  </button>
) : (
                  <button
                    style={{
                      ...styles.upgradeButton,
                      ...(downgrade && styles.downgradeButton),
                    }}
                    onClick={() => handleUpgrade(plan)}
                    disabled={upgradeMutation.isPending && selectedPlan?.id === plan.id}
                    onMouseEnter={(e) => {
                      if (!downgrade) {
                        e.currentTarget.style.transform = "translateY(-1px)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    {upgradeMutation.isPending && selectedPlan?.id === plan.id ? (
                      <Loader2 size={16} style={styles.buttonSpinner} />
                    ) : (
                      <>
                        {downgrade ? "Downgrade" : "Upgrade"} to {plan.name}
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Confirmation Modal */}
      {selectedPlan && (
        <div style={styles.modalOverlay} onClick={cancelUpgrade}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h4>Confirm Plan Change</h4>
              <button onClick={cancelUpgrade} style={styles.modalClose}>
                <X size={18} />
              </button>
            </div>
            
            <div style={styles.modalBody}>
              <div style={styles.changeSummary}>
                <div style={styles.changeRow}>
                  <span>Current Plan:</span>
                  <strong>{currentSubscription?.planName}</strong>
                  <span style={styles.changePrice}>
                    {currentSubscription?.priceCents === 0 ? "Free" : `$${(currentSubscription?.priceCents || 0) / 100}`}
                  </span>
                </div>
                <div style={styles.arrowIcon}>↓</div>
                <div style={styles.changeRow}>
                  <span>New Plan:</span>
                  <strong>{selectedPlan.name}</strong>
                  <span style={styles.changePrice}>
                    {selectedPlan.price_cents === 0 ? "Free" : `$${selectedPlan.price_cents / 100}`}
                  </span>
                </div>
              </div>

              {selectedPlan.price_cents > (currentSubscription?.priceCents ?? 0) && (
                <div style={styles.infoBox}>
                  <CreditCard size={16} />
                  <span>You will be redirected to Stripe to complete the payment.</span>
                </div>
              )}

              {selectedPlan.price_cents < (currentSubscription?.priceCents ?? 0) && selectedPlan.price_cents > 0 && (
                <div style={styles.warningBox}>
                  <AlertCircle size={16} />
                  <span>Downgrading will take effect at the end of your current billing period.</span>
                </div>
              )}

              {selectedPlan.price_cents === 0 && (currentSubscription?.priceCents ?? 0) > 0 && (
                <div style={styles.warningBox}>
                  <AlertCircle size={16} />
                  <span>Downgrading to Free will remove access to premium features immediately.</span>
                </div>
              )}
            </div>

            <div style={styles.modalFooter}>
              <button onClick={cancelUpgrade} style={styles.cancelButton}>
                Cancel
              </button>
              <button onClick={confirmUpgrade} style={styles.confirmButton}>
                {selectedPlan.price_cents > (currentSubscription?.priceCents || 0) 
                  ? "Proceed to Payment" 
                  : "Confirm Change"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-components
function FeatureBadge({ active, label }: { active: boolean; label: string }) {
  return (
    <div style={{ ...styles.featureBadge, ...(active ? styles.featureActive : styles.featureInactive) }}>
      {active ? "✓" : "✗"} {label}
    </div>
  );
}

function PlanFeature({ active, text }: { active: boolean; text: string }) {
  return (
    <div style={styles.planFeatureItem}>
      <span style={{ color: active ? "#22C55E" : "#9CA3B4" }}>
        {active ? "✓" : "✗"}
      </span>
      <span style={{ textDecoration: active ? "none" : "line-through", color: active ? "#5F6577" : "#9CA3B4" }}>
        {text}
      </span>
    </div>
  );
}

// Styles following IntegrationsTab design patterns
const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 20px",
    color: "#5F6577",
  },
  spinner: {
    animation: "spin 1s linear infinite",
    marginBottom: "16px",
    color: "#b5484b",
  },
  currentPlanCard: {
    background: "linear-gradient(135deg, rgba(181,72,75,0.05), rgba(107,48,87,0.05))",
    border: "2px solid rgba(181,72,75,0.2)",
    borderRadius: "12px",
    overflow: "hidden",
  },
  currentPlanHeader: {
    padding: "20px 24px",
    background: "#FDFDFC",
    borderBottom: "1px solid #E6E4DF",
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  currentPlanIcon: {
    width: "48px",
    height: "48px",
    background: "linear-gradient(135deg, #b5484b, #6b3057)",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
  },
  currentPlanContent: {
    flex: 1,
  },
  currentPlanBadge: {
    display: "inline-block",
    background: "linear-gradient(135deg, #b5484b, #6b3057)",
    color: "#fff",
    fontSize: "10px",
    fontWeight: 600,
    padding: "4px 10px",
    borderRadius: "20px",
    marginBottom: "8px",
  },
  currentPlanName: {
    fontSize: "20px",
    fontWeight: 700,
    color: "#1A1D23",
    margin: "0 0 4px 0",
    fontFamily: "'Space Grotesk', sans-serif",
  },
  currentPlanPrice: {
    fontSize: "28px",
    fontWeight: 700,
    color: "#1A1D23",
  },
  priceCycle: {
    fontSize: "14px",
    fontWeight: 400,
    color: "#5F6577",
  },
  currentPlanDetails: {
    padding: "20px 24px",
    borderBottom: "1px solid #E6E4DF",
  },
  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "13px",
    padding: "6px 0",
    color: "#5F6577",
  },
  remainingDays: {
    color: "#b5484b",
    fontWeight: 600,
  },
  activeStatus: {
    color: "#22C55E",
    fontWeight: 600,
  },
  inactiveStatus: {
    color: "#EF4444",
    fontWeight: 600,
  },
  featureGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    padding: "20px 24px",
  },
  featureBadge: {
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: 500,
  },
  featureActive: {
    background: "#22C55E15",
    color: "#22C55E",
    border: "1px solid #22C55E30",
  },
  featureInactive: {
    background: "#F4F3F0",
    color: "#9CA3B4",
    border: "1px solid #E6E4DF",
  },
  servicesCount: {
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: 500,
    background: "#F4F3F0",
    color: "#5F6577",
  },
  plansSection: {
    background: "#fff",
    border: "1px solid #E6E4DF",
    borderRadius: "12px",
    overflow: "hidden",
  },
  plansHeader: {
    padding: "20px 24px",
    background: "#FDFDFC",
    borderBottom: "1px solid #E6E4DF",
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: 700,
    color: "#1A1D23",
    margin: "0 0 4px 0",
    fontFamily: "'Space Grotesk', sans-serif",
  },
  sectionDescription: {
    fontSize: "13px",
    color: "#5F6577",
    margin: 0,
  },
  plansGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "1px",
    background: "#E6E4DF",
  },
  planCard: {
    background: "#fff",
    padding: "24px",
    position: "relative",
    transition: "all 0.2s",
  },
  currentPlanCardStyle: {
    background: "linear-gradient(135deg, #fff, rgba(181,72,75,0.02))",
    boxShadow: "inset 0 0 0 2px #b5484b",
  },
  selectedPlanCard: {
    background: "linear-gradient(135deg, #fff, rgba(181,72,75,0.05))",
    boxShadow: "inset 0 0 0 2px #b5484b",
  },
  popularBadge: {
    position: "absolute",
    top: "12px",
    right: "12px",
    background: "linear-gradient(135deg, #b5484b, #6b3057)",
    color: "#fff",
    fontSize: "10px",
    fontWeight: 600,
    padding: "4px 12px",
    borderRadius: "20px",
  },
  activeBadge: {
    display: "inline-block",
    background: "#22C55E15",
    color: "#22C55E",
    border: "1px solid #22C55E30",
    fontSize: "10px",
    fontWeight: 600,
    padding: "4px 12px",
    borderRadius: "20px",
    marginBottom: "16px",
  },
  planHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "20px",
  },
  planIconWrapper: {
    width: "40px",
    height: "40px",
    background: "#F4F3F0",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#b5484b",
  },
  planName: {
    fontSize: "18px",
    fontWeight: 700,
    color: "#1A1D23",
    margin: 0,
    fontFamily: "'Space Grotesk', sans-serif",
  },
  planDescription: {
    fontSize: "12px",
    color: "#5F6577",
    margin: "4px 0 0 0",
    lineHeight: 1.5,
  },
  planPriceContainer: {
    marginBottom: "20px",
  },
  planPrice: {
    fontSize: "24px",
    fontWeight: 700,
    color: "#1A1D23",
  },
  planFeatures: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginBottom: "24px",
  },
  planFeatureItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "12px",
  },
  currentButton: {
  width: "100%",
  padding: "12px",
  background: "#F4F3F0",
  color: "#5F6577",
  border: "none",
  borderRadius: "8px",
  fontSize: "13px",
  fontWeight: 600,
  cursor: "not-allowed",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
},
currentButtonSubtext: {
  fontSize: "11px",
  fontWeight: 400,
  color: "#b5484b",
  marginLeft: "4px",
},
  upgradeButton: {
    width: "100%",
    padding: "10px",
    background: "linear-gradient(135deg, #b5484b, #6b3057)",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    transition: "transform 0.2s",
  },
  downgradeButton: {
    background: "#F4F3F0",
    color: "#5F6577",
  },
  buttonSpinner: {
    animation: "spin 1s linear infinite",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.7)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    background: "#fff",
    borderRadius: "16px",
    maxWidth: "500px",
    width: "90%",
    overflow: "hidden",
    boxShadow: "0 24px 48px rgba(0,0,0,0.2)",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 24px",
    borderBottom: "1px solid #E6E4DF",
  },
  modalClose: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "4px",
    color: "#5F6577",
  },
  modalBody: {
    padding: "24px",
  },
  changeSummary: {
    background: "#F9F8F6",
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "20px",
  },
  changeRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 0",
    fontSize: "14px",
  },
  changePrice: {
    fontWeight: 600,
    color: "#1A1D23",
  },
  arrowIcon: {
    textAlign: "center",
    fontSize: "18px",
    color: "#b5484b",
    margin: "4px 0",
  },
  infoBox: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 16px",
    background: "#EFF6FF",
    borderRadius: "8px",
    fontSize: "13px",
    color: "#1E40AF",
    marginTop: "16px",
  },
  warningBox: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 16px",
    background: "#FFFBEB",
    borderRadius: "8px",
    fontSize: "13px",
    color: "#D97706",
    marginTop: "16px",
  },
  modalFooter: {
    display: "flex",
    gap: "12px",
    padding: "20px 24px",
    borderTop: "1px solid #E6E4DF",
  },
  cancelButton: {
    flex: 1,
    padding: "10px",
    background: "#fff",
    border: "1.5px solid #E6E4DF",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    color: "#5F6577",
  },
  confirmButton: {
    flex: 1,
    padding: "10px",
    background: "linear-gradient(135deg, #b5484b, #6b3057)",
    border: "none",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    color: "#fff",
  },
};

// Add keyframes animation
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(styleSheet);
}