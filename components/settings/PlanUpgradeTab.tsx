"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, X, Loader2, CreditCard, AlertCircle, ArrowRight, Calendar, Zap, Crown, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import type { PublicPlan } from "@/lib/types";
import { fetchCurrentSubscription, QK, type CurrentSubscription } from "@/lib/queries";
import s from "./PlanUpgradeTab.module.css";

export function PlanUpgradeTab() {
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState<PublicPlan | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: allPlans = [], isLoading: plansLoading } = useQuery<PublicPlan[]>({
    queryKey: ["public-plans"],
    queryFn: async () => {
      const response = await fetch("/api/public/plans");
      if (!response.ok) throw new Error("Failed to fetch plans");
      return response.json();
    },
    staleTime: 5 * 60_000,
  });

  const { data: currentSubscription, isLoading: subscriptionLoading, refetch: refetchSubscription } = useQuery<CurrentSubscription>({
    queryKey: ["current-subscription"],
    queryFn: fetchCurrentSubscription,
    staleTime: 6000,
  });

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
    if (plan.id === currentSubscription.planId) {
      toast.info("This is already your current plan");
      return;
    }
    setSelectedPlan(plan);
  };

  const confirmUpgrade = () => {
    if (selectedPlan) upgradeMutation.mutate(selectedPlan.id);
  };

  const cancelUpgrade = () => setSelectedPlan(null);

  const isFree = (plan: PublicPlan) => plan.price_cents === 0;
  const getPriceDisplay = (plan: PublicPlan) => {
    if (isFree(plan)) return "Free";
    const price = (plan.price_cents / 100).toFixed(0);
    const cycle = plan.billing_cycle === "monthly" ? "/month" : "/year";
    return `$${price}${cycle}`;
  };

  const isCurrentPlan = (plan: PublicPlan) => currentSubscription?.planId === plan.id;

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
    if (name.includes("pro")) return <Zap size={20} />;
    if (name.includes("platinum") || name.includes("premium")) return <Crown size={20} />;
    return <Sparkles size={20} />;
  };

  if (plansLoading || subscriptionLoading) {
    return (
      <div className={s.loadingContainer}>
        <Loader2 size={32} className={s.spinner} />
        <p>Loading plan information...</p>
      </div>
    );
  }

  const availablePlans = allPlans.filter((plan) => !isCurrentPlan(plan));

  return (
    <div className={s.container}>
      {/* Current Plan Card */}
      {currentSubscription && (
        <div className={s.currentPlanCard}>
          <div className={s.currentPlanHeader}>
            <div className={s.currentPlanIcon}>
              {getPlanIcon(currentSubscription.planName)}
            </div>
            <div className={s.currentPlanContent}>
              <div className={s.currentPlanBadge}>Current Plan</div>
              <h3 className={s.currentPlanName}>{currentSubscription.planName}</h3>
              <div className={s.currentPlanPrice}>
                {currentSubscription.priceCents === 0 ? (
                  "Free"
                ) : (
                  <>
                    ${(currentSubscription.priceCents / 100).toFixed(0)}
                    <span className={s.priceCycle}>
                      /{currentSubscription.billingCycle === "monthly" ? "month" : "year"}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className={s.currentPlanDetails}>
            <div className={s.detailRow}>
              <span>Status:</span>
              <span className={currentSubscription.status === "active" ? s.activeStatus : s.inactiveStatus}>
                {currentSubscription.status === "active" ? "✅ Active" : "⚠️ Inactive"}
              </span>
            </div>

            {currentSubscription.remainingDaysText && currentSubscription.status === "active" && (
              <div className={s.detailRow}>
                <span className={s.detailRowIcon}>
                  <Calendar size={12} /> Billing period:
                </span>
                <span className={s.remainingDays}>
                  {currentSubscription.remainingDaysText}
                </span>
              </div>
            )}

            {currentSubscription.currentPeriodEnd && (
              <div className={s.detailRow}>
                <span>Renews on:</span>
                <span>{new Date(currentSubscription.currentPeriodEnd).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          <div className={s.featureGrid}>
            <FeatureBadge active={currentSubscription.features.whatsappAccess} label="WhatsApp" />
            <FeatureBadge active={currentSubscription.features.instagramAccess} label="Instagram" />
            <FeatureBadge active={currentSubscription.features.facebookAccess} label="Facebook" />
            <FeatureBadge active={currentSubscription.features.aiCallsAccess} label="AI Calls" />
            <FeatureBadge active={currentSubscription.features.widgetAccess} label="Booking Widget" />
            <div className={s.servicesCount}>
              📍 {currentSubscription.features.maxServices} services included
            </div>
          </div>
        </div>
      )}

      {/* Available Plans Section */}
      <div className={s.plansSection}>
        <div className={s.plansHeader}>
          <h4 className={s.sectionTitle}>Available Plans</h4>
          <p className={s.sectionDescription}>
            Choose the perfect plan for your salon. Upgrade anytime.
          </p>
        </div>

        <div className={s.plansGrid}>
          {availablePlans.map((plan) => {
            const isCurrent = isCurrentPlan(plan);
            const downgrade = isDowngrade(plan);

            return (
              <div
                key={plan.id}
                className={`${s.planCard} ${isCurrent ? s["planCard--current"] : ""} ${selectedPlan?.id === plan.id ? s["planCard--selected"] : ""}`}
              >
                {plan.highlight && !isCurrent && (
                  <div className={s.popularBadge}>Most Popular</div>
                )}

                {isCurrent && (
                  <div className={s.activeBadge}>
                    <Check size={12} /> Active Plan
                  </div>
                )}

                <div className={s.planHeader}>
                  <div className={s.planIconWrapper}>
                    {getPlanIcon(plan.name)}
                  </div>
                  <div>
                    <h5 className={s.planName}>{plan.name}</h5>
                    {plan.description && (
                      <p className={s.planDescription}>{plan.description}</p>
                    )}
                  </div>
                </div>

                <div className={s.planPriceContainer}>
                  <div className={s.planPrice}>{getPriceDisplay(plan)}</div>
                </div>

                <div className={s.planFeatures}>
                  <PlanFeature active={true} text={`Up to ${plan.max_services} services`} />
                  <PlanFeature active={!!plan.whatsapp_access} text="WhatsApp Booking" />
                  <PlanFeature active={!!plan.instagram_access} text="Instagram Booking" />
                  <PlanFeature active={!!plan.facebook_access} text="Facebook Booking" />
                  <PlanFeature active={!!plan.ai_calls_access} text="AI Voice Calls" />
                  <PlanFeature active={!!plan.widget_access} text="Website Widget" />
                </div>

                {isCurrent ? (
                  <button className={s.currentButton} disabled>
                    <Check size={16} />
                    Current Plan
                    {currentSubscription?.remainingDaysText && (
                      <span className={s.currentButtonSubtext}>
                        ({currentSubscription.remainingDaysText})
                      </span>
                    )}
                  </button>
                ) : (
                  <button
                    className={`${s.upgradeButton} ${downgrade ? s["upgradeButton--downgrade"] : ""}`}
                    onClick={() => handleUpgrade(plan)}
                    disabled={upgradeMutation.isPending && selectedPlan?.id === plan.id}
                  >
                    {upgradeMutation.isPending && selectedPlan?.id === plan.id ? (
                      <Loader2 size={16} className={s.buttonSpinner} />
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
        <div className={s.modalOverlay} onClick={cancelUpgrade}>
          <div className={s.modal} onClick={(e) => e.stopPropagation()}>
            <div className={s.modalHeader}>
              <h4>Confirm Plan Change</h4>
              <button onClick={cancelUpgrade} className={s.modalClose}>
                <X size={18} />
              </button>
            </div>

            <div className={s.modalBody}>
              <div className={s.changeSummary}>
                <div className={s.changeRow}>
                  <span>Current Plan:</span>
                  <strong>{currentSubscription?.planName}</strong>
                  <span className={s.changePrice}>
                    {currentSubscription?.priceCents === 0 ? "Free" : `$${(currentSubscription?.priceCents || 0) / 100}`}
                  </span>
                </div>
                <div className={s.arrowIcon}>↓</div>
                <div className={s.changeRow}>
                  <span>New Plan:</span>
                  <strong>{selectedPlan.name}</strong>
                  <span className={s.changePrice}>
                    {selectedPlan.price_cents === 0 ? "Free" : `$${selectedPlan.price_cents / 100}`}
                  </span>
                </div>
              </div>

              {selectedPlan.price_cents > (currentSubscription?.priceCents ?? 0) && (
                <div className={s.infoBox}>
                  <CreditCard size={16} />
                  <span>You will be redirected to Stripe to complete the payment.</span>
                </div>
              )}

              {selectedPlan.price_cents < (currentSubscription?.priceCents ?? 0) && selectedPlan.price_cents > 0 && (
                <div className={s.warningBox}>
                  <AlertCircle size={16} />
                  <span>Downgrading will take effect at the end of your current billing period.</span>
                </div>
              )}

              {selectedPlan.price_cents === 0 && (currentSubscription?.priceCents ?? 0) > 0 && (
                <div className={s.warningBox}>
                  <AlertCircle size={16} />
                  <span>Downgrading to Free will remove access to premium features immediately.</span>
                </div>
              )}
            </div>

            <div className={s.modalFooter}>
              <button onClick={cancelUpgrade} className={s.cancelButton}>
                Cancel
              </button>
              <button onClick={confirmUpgrade} className={s.confirmButton}>
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

function FeatureBadge({ active, label }: { active: boolean; label: string }) {
  return (
    <div className={`${s.featureBadge} ${active ? s["featureBadge--active"] : s["featureBadge--inactive"]}`}>
      {active ? "✓" : "✗"} {label}
    </div>
  );
}

function PlanFeature({ active, text }: { active: boolean; text: string }) {
  return (
    <div className={s.planFeatureItem}>
      <span className={active ? s["planFeatureCheck--active"] : s["planFeatureCheck--inactive"]}>
        {active ? "✓" : "✗"}
      </span>
      <span className={active ? s["planFeatureText--active"] : s["planFeatureText--inactive"]}>
        {text}
      </span>
    </div>
  );
}
