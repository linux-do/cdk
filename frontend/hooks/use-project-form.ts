'use client';

import {useState, useCallback} from 'react';
import {TrustLevel} from '@/lib/services/core/types';
import {DistributionType, ProjectListItem} from '@/lib/services/project/types';
import {DEFAULT_FORM_VALUES} from '@/components/common/project';

export interface ProjectFormData {
  name: string;
  description: string;
  startTime: Date;
  endTime: Date;
  minimumTrustLevel: TrustLevel;
  allowSameIP: boolean;
  riskLevel: number;
  distributionType: DistributionType;
  topicId?: number;
}

export interface UseProjectFormOptions {
  initialData?: ProjectFormData;
  mode: 'create' | 'edit';
  project?: ProjectListItem;
}

export function useProjectForm(options: UseProjectFormOptions) {
  const {initialData, mode, project} = options;

  const getInitialFormData = useCallback((): ProjectFormData => {
    if (mode === 'edit' && project) {
      return {
        name: project.name,
        description: project.description || '',
        startTime: new Date(project.start_time),
        endTime: new Date(project.end_time),
        minimumTrustLevel: project.minimum_trust_level,
        allowSameIP: project.allow_same_ip,
        riskLevel: project.risk_level,
        distributionType: project.distribution_type,
      };
    }

    return initialData || {
      name: '',
      description: '',
      startTime: new Date(),
      endTime: new Date(Date.now() + DEFAULT_FORM_VALUES.TIME_OFFSET_24H),
      minimumTrustLevel: TrustLevel.BASIC_USER,
      allowSameIP: false,
      riskLevel: DEFAULT_FORM_VALUES.RISK_LEVEL,
      distributionType: DistributionType.ONE_FOR_EACH,
    };
  }, [initialData, mode, project]);

  const [formData, setFormData] = useState<ProjectFormData>(getInitialFormData);

  const updateFormField = useCallback(<K extends keyof ProjectFormData>(
    field: K,
    value: ProjectFormData[K],
  ) => {
    setFormData((prev) => ({...prev, [field]: value}));
  }, [setFormData]);

  const resetForm = useCallback(() => {
    setFormData(getInitialFormData());
  }, [getInitialFormData]);

  return {
    formData,
    setFormData,
    updateFormField,
    resetForm,
  };
}
