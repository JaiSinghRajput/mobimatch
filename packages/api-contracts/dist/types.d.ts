import { z } from 'zod';
export declare const UserStatusSchema: z.ZodEnum<["active", "deactivated", "deleted"]>;
export type UserStatus = z.infer<typeof UserStatusSchema>;
export declare const ClientAppTypeSchema: z.ZodEnum<["user", "admin"]>;
export type ClientAppType = z.infer<typeof ClientAppTypeSchema>;
export declare const GoogleAuthRequestSchema: z.ZodObject<{
    idToken: z.ZodString;
    clientApp: z.ZodDefault<z.ZodEnum<["user", "admin"]>>;
}, "strip", z.ZodTypeAny, {
    idToken: string;
    clientApp: "user" | "admin";
}, {
    idToken: string;
    clientApp?: "user" | "admin" | undefined;
}>;
export type GoogleAuthRequest = z.infer<typeof GoogleAuthRequestSchema>;
export declare const RefreshTokenRequestSchema: z.ZodObject<{
    refreshToken: z.ZodString;
}, "strip", z.ZodTypeAny, {
    refreshToken: string;
}, {
    refreshToken: string;
}>;
export type RefreshTokenRequest = z.infer<typeof RefreshTokenRequestSchema>;
export declare const TokenResponseSchema: z.ZodObject<{
    accessToken: z.ZodString;
    refreshToken: z.ZodString;
    expiresIn: z.ZodNumber;
    user: z.ZodObject<{
        id: z.ZodString;
        email: z.ZodString;
        name: z.ZodString;
        phone: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        shopName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        city: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        status: z.ZodEnum<["active", "deactivated", "deleted"]>;
        isAdmin: z.ZodBoolean;
        isProfileComplete: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        status: "active" | "deactivated" | "deleted";
        id: string;
        email: string;
        name: string;
        isAdmin: boolean;
        isProfileComplete: boolean;
        phone?: string | null | undefined;
        shopName?: string | null | undefined;
        city?: string | null | undefined;
    }, {
        status: "active" | "deactivated" | "deleted";
        id: string;
        email: string;
        name: string;
        isAdmin: boolean;
        isProfileComplete: boolean;
        phone?: string | null | undefined;
        shopName?: string | null | undefined;
        city?: string | null | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    user: {
        status: "active" | "deactivated" | "deleted";
        id: string;
        email: string;
        name: string;
        isAdmin: boolean;
        isProfileComplete: boolean;
        phone?: string | null | undefined;
        shopName?: string | null | undefined;
        city?: string | null | undefined;
    };
    refreshToken: string;
    accessToken: string;
    expiresIn: number;
}, {
    user: {
        status: "active" | "deactivated" | "deleted";
        id: string;
        email: string;
        name: string;
        isAdmin: boolean;
        isProfileComplete: boolean;
        phone?: string | null | undefined;
        shopName?: string | null | undefined;
        city?: string | null | undefined;
    };
    refreshToken: string;
    accessToken: string;
    expiresIn: number;
}>;
export type TokenResponse = z.infer<typeof TokenResponseSchema>;
export declare const CompleteProfileRequestSchema: z.ZodObject<{
    phone: z.ZodString;
    shopName: z.ZodString;
    city: z.ZodString;
    termsAccepted: z.ZodLiteral<true>;
    privacyAccepted: z.ZodLiteral<true>;
}, "strip", z.ZodTypeAny, {
    phone: string;
    shopName: string;
    city: string;
    termsAccepted: true;
    privacyAccepted: true;
}, {
    phone: string;
    shopName: string;
    city: string;
    termsAccepted: true;
    privacyAccepted: true;
}>;
export type CompleteProfileRequest = z.infer<typeof CompleteProfileRequestSchema>;
export declare const UpdateProfileRequestSchema: z.ZodObject<{
    phone: z.ZodOptional<z.ZodString>;
    shopName: z.ZodOptional<z.ZodString>;
    city: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    phone?: string | undefined;
    shopName?: string | undefined;
    city?: string | undefined;
}, {
    phone?: string | undefined;
    shopName?: string | undefined;
    city?: string | undefined;
}>;
export type UpdateProfileRequest = z.infer<typeof UpdateProfileRequestSchema>;
export declare const UserProfileSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    name: z.ZodString;
    phone: z.ZodString;
    shopName: z.ZodString;
    city: z.ZodString;
    status: z.ZodEnum<["active", "deactivated", "deleted"]>;
    isAdmin: z.ZodBoolean;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    status: "active" | "deactivated" | "deleted";
    id: string;
    email: string;
    name: string;
    phone: string;
    shopName: string;
    city: string;
    isAdmin: boolean;
    createdAt: string;
    updatedAt: string;
}, {
    status: "active" | "deactivated" | "deleted";
    id: string;
    email: string;
    name: string;
    phone: string;
    shopName: string;
    city: string;
    isAdmin: boolean;
    createdAt: string;
    updatedAt: string;
}>;
export type UserProfile = z.infer<typeof UserProfileSchema>;
export declare const BrandSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    normalizedName: z.ZodString;
    isActive: z.ZodBoolean;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    deactivatedAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    normalizedName: string;
    isActive: boolean;
    deactivatedAt?: string | null | undefined;
}, {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    normalizedName: string;
    isActive: boolean;
    deactivatedAt?: string | null | undefined;
}>;
export type Brand = z.infer<typeof BrandSchema>;
export declare const MobileModelSchema: z.ZodObject<{
    id: z.ZodString;
    brandId: z.ZodString;
    brandName: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    normalizedName: z.ZodString;
    modelNumber: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    isActive: z.ZodBoolean;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    deactivatedAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    normalizedName: string;
    isActive: boolean;
    brandId: string;
    deactivatedAt?: string | null | undefined;
    brandName?: string | undefined;
    modelNumber?: string | null | undefined;
}, {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    normalizedName: string;
    isActive: boolean;
    brandId: string;
    deactivatedAt?: string | null | undefined;
    brandName?: string | undefined;
    modelNumber?: string | null | undefined;
}>;
export type MobileModel = z.infer<typeof MobileModelSchema>;
export declare const SparePartCategorySchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    normalizedName: z.ZodString;
    isActive: z.ZodBoolean;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    deactivatedAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    normalizedName: string;
    isActive: boolean;
    deactivatedAt?: string | null | undefined;
}, {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    normalizedName: string;
    isActive: boolean;
    deactivatedAt?: string | null | undefined;
}>;
export type SparePartCategory = z.infer<typeof SparePartCategorySchema>;
export declare const ModelSearchItemSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    brandId: z.ZodString;
    brandName: z.ZodString;
    modelNumber: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    brandId: string;
    brandName: string;
    modelNumber?: string | null | undefined;
}, {
    id: string;
    name: string;
    brandId: string;
    brandName: string;
    modelNumber?: string | null | undefined;
}>;
export type ModelSearchItem = z.infer<typeof ModelSearchItemSchema>;
export declare const CompatibilityGroupMemberItemSchema: z.ZodObject<{
    modelId: z.ZodString;
    modelName: z.ZodString;
    brandId: z.ZodString;
    brandName: z.ZodString;
    modelNumber: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    brandId: string;
    brandName: string;
    modelId: string;
    modelName: string;
    modelNumber?: string | null | undefined;
}, {
    brandId: string;
    brandName: string;
    modelId: string;
    modelName: string;
    modelNumber?: string | null | undefined;
}>;
export type CompatibilityGroupMemberItem = z.infer<typeof CompatibilityGroupMemberItemSchema>;
export declare const CompatibilityResultSchema: z.ZodObject<{
    categoryId: z.ZodString;
    categoryName: z.ZodString;
    selectedModel: z.ZodObject<{
        modelId: z.ZodString;
        modelName: z.ZodString;
        brandId: z.ZodString;
        brandName: z.ZodString;
        modelNumber: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        brandId: string;
        brandName: string;
        modelId: string;
        modelName: string;
        modelNumber?: string | null | undefined;
    }, {
        brandId: string;
        brandName: string;
        modelId: string;
        modelName: string;
        modelNumber?: string | null | undefined;
    }>;
    groupId: z.ZodString;
    totalCount: z.ZodNumber;
    models: z.ZodArray<z.ZodObject<{
        modelId: z.ZodString;
        modelName: z.ZodString;
        brandId: z.ZodString;
        brandName: z.ZodString;
        modelNumber: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        brandId: string;
        brandName: string;
        modelId: string;
        modelName: string;
        modelNumber?: string | null | undefined;
    }, {
        brandId: string;
        brandName: string;
        modelId: string;
        modelName: string;
        modelNumber?: string | null | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    categoryId: string;
    categoryName: string;
    selectedModel: {
        brandId: string;
        brandName: string;
        modelId: string;
        modelName: string;
        modelNumber?: string | null | undefined;
    };
    groupId: string;
    totalCount: number;
    models: {
        brandId: string;
        brandName: string;
        modelId: string;
        modelName: string;
        modelNumber?: string | null | undefined;
    }[];
}, {
    categoryId: string;
    categoryName: string;
    selectedModel: {
        brandId: string;
        brandName: string;
        modelId: string;
        modelName: string;
        modelNumber?: string | null | undefined;
    };
    groupId: string;
    totalCount: number;
    models: {
        brandId: string;
        brandName: string;
        modelId: string;
        modelName: string;
        modelNumber?: string | null | undefined;
    }[];
}>;
export type CompatibilityResult = z.infer<typeof CompatibilityResultSchema>;
export declare const ParsedModelTokenSchema: z.ZodObject<{
    raw: z.ZodString;
    normalized: z.ZodString;
    brandHint: z.ZodOptional<z.ZodString>;
    modelNameHint: z.ZodString;
}, "strip", z.ZodTypeAny, {
    raw: string;
    normalized: string;
    modelNameHint: string;
    brandHint?: string | undefined;
}, {
    raw: string;
    normalized: string;
    modelNameHint: string;
    brandHint?: string | undefined;
}>;
export type ParsedModelToken = z.infer<typeof ParsedModelTokenSchema>;
export declare const ParsedLineSchema: z.ZodObject<{
    lineNumber: z.ZodNumber;
    rawLine: z.ZodString;
    tokens: z.ZodArray<z.ZodObject<{
        raw: z.ZodString;
        normalized: z.ZodString;
        brandHint: z.ZodOptional<z.ZodString>;
        modelNameHint: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        raw: string;
        normalized: string;
        modelNameHint: string;
        brandHint?: string | undefined;
    }, {
        raw: string;
        normalized: string;
        modelNameHint: string;
        brandHint?: string | undefined;
    }>, "many">;
    error: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    lineNumber: number;
    rawLine: string;
    tokens: {
        raw: string;
        normalized: string;
        modelNameHint: string;
        brandHint?: string | undefined;
    }[];
    error?: string | null | undefined;
}, {
    lineNumber: number;
    rawLine: string;
    tokens: {
        raw: string;
        normalized: string;
        modelNameHint: string;
        brandHint?: string | undefined;
    }[];
    error?: string | null | undefined;
}>;
export type ParsedLine = z.infer<typeof ParsedLineSchema>;
export declare const ResolvedModelMatchSchema: z.ZodObject<{
    rawInput: z.ZodString;
    status: z.ZodEnum<["matched", "missing_model", "missing_brand", "ambiguous"]>;
    matchedModel: z.ZodOptional<z.ZodNullable<z.ZodObject<{
        id: z.ZodString;
        brandId: z.ZodString;
        brandName: z.ZodOptional<z.ZodString>;
        name: z.ZodString;
        normalizedName: z.ZodString;
        modelNumber: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        isActive: z.ZodBoolean;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
        deactivatedAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        createdAt: string;
        updatedAt: string;
        normalizedName: string;
        isActive: boolean;
        brandId: string;
        deactivatedAt?: string | null | undefined;
        brandName?: string | undefined;
        modelNumber?: string | null | undefined;
    }, {
        id: string;
        name: string;
        createdAt: string;
        updatedAt: string;
        normalizedName: string;
        isActive: boolean;
        brandId: string;
        deactivatedAt?: string | null | undefined;
        brandName?: string | undefined;
        modelNumber?: string | null | undefined;
    }>>>;
    candidateModels: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        brandId: z.ZodString;
        brandName: z.ZodOptional<z.ZodString>;
        name: z.ZodString;
        normalizedName: z.ZodString;
        modelNumber: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        isActive: z.ZodBoolean;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
        deactivatedAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        createdAt: string;
        updatedAt: string;
        normalizedName: string;
        isActive: boolean;
        brandId: string;
        deactivatedAt?: string | null | undefined;
        brandName?: string | undefined;
        modelNumber?: string | null | undefined;
    }, {
        id: string;
        name: string;
        createdAt: string;
        updatedAt: string;
        normalizedName: string;
        isActive: boolean;
        brandId: string;
        deactivatedAt?: string | null | undefined;
        brandName?: string | undefined;
        modelNumber?: string | null | undefined;
    }>, "many">>;
    suggestedBrandName: z.ZodOptional<z.ZodString>;
    suggestedModelName: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "matched" | "missing_model" | "missing_brand" | "ambiguous";
    rawInput: string;
    matchedModel?: {
        id: string;
        name: string;
        createdAt: string;
        updatedAt: string;
        normalizedName: string;
        isActive: boolean;
        brandId: string;
        deactivatedAt?: string | null | undefined;
        brandName?: string | undefined;
        modelNumber?: string | null | undefined;
    } | null | undefined;
    candidateModels?: {
        id: string;
        name: string;
        createdAt: string;
        updatedAt: string;
        normalizedName: string;
        isActive: boolean;
        brandId: string;
        deactivatedAt?: string | null | undefined;
        brandName?: string | undefined;
        modelNumber?: string | null | undefined;
    }[] | undefined;
    suggestedBrandName?: string | undefined;
    suggestedModelName?: string | undefined;
}, {
    status: "matched" | "missing_model" | "missing_brand" | "ambiguous";
    rawInput: string;
    matchedModel?: {
        id: string;
        name: string;
        createdAt: string;
        updatedAt: string;
        normalizedName: string;
        isActive: boolean;
        brandId: string;
        deactivatedAt?: string | null | undefined;
        brandName?: string | undefined;
        modelNumber?: string | null | undefined;
    } | null | undefined;
    candidateModels?: {
        id: string;
        name: string;
        createdAt: string;
        updatedAt: string;
        normalizedName: string;
        isActive: boolean;
        brandId: string;
        deactivatedAt?: string | null | undefined;
        brandName?: string | undefined;
        modelNumber?: string | null | undefined;
    }[] | undefined;
    suggestedBrandName?: string | undefined;
    suggestedModelName?: string | undefined;
}>;
export type ResolvedModelMatch = z.infer<typeof ResolvedModelMatchSchema>;
export declare const ConflictItemSchema: z.ZodObject<{
    modelId: z.ZodString;
    modelName: z.ZodString;
    brandName: z.ZodString;
    existingGroupId: z.ZodString;
    proposedLineNumber: z.ZodNumber;
    existingGroupMemberCount: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    brandName: string;
    modelId: string;
    modelName: string;
    existingGroupId: string;
    proposedLineNumber: number;
    existingGroupMemberCount: number;
}, {
    brandName: string;
    modelId: string;
    modelName: string;
    existingGroupId: string;
    proposedLineNumber: number;
    existingGroupMemberCount: number;
}>;
export type ConflictItem = z.infer<typeof ConflictItemSchema>;
export declare const ParsePreviewResponseSchema: z.ZodObject<{
    previewId: z.ZodString;
    categoryId: z.ZodString;
    categoryName: z.ZodString;
    lines: z.ZodArray<z.ZodObject<{
        lineNumber: z.ZodNumber;
        rawLine: z.ZodString;
        models: z.ZodArray<z.ZodObject<{
            rawInput: z.ZodString;
            status: z.ZodEnum<["matched", "missing_model", "missing_brand", "ambiguous"]>;
            matchedModel: z.ZodOptional<z.ZodNullable<z.ZodObject<{
                id: z.ZodString;
                brandId: z.ZodString;
                brandName: z.ZodOptional<z.ZodString>;
                name: z.ZodString;
                normalizedName: z.ZodString;
                modelNumber: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                isActive: z.ZodBoolean;
                createdAt: z.ZodString;
                updatedAt: z.ZodString;
                deactivatedAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, "strip", z.ZodTypeAny, {
                id: string;
                name: string;
                createdAt: string;
                updatedAt: string;
                normalizedName: string;
                isActive: boolean;
                brandId: string;
                deactivatedAt?: string | null | undefined;
                brandName?: string | undefined;
                modelNumber?: string | null | undefined;
            }, {
                id: string;
                name: string;
                createdAt: string;
                updatedAt: string;
                normalizedName: string;
                isActive: boolean;
                brandId: string;
                deactivatedAt?: string | null | undefined;
                brandName?: string | undefined;
                modelNumber?: string | null | undefined;
            }>>>;
            candidateModels: z.ZodOptional<z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                brandId: z.ZodString;
                brandName: z.ZodOptional<z.ZodString>;
                name: z.ZodString;
                normalizedName: z.ZodString;
                modelNumber: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                isActive: z.ZodBoolean;
                createdAt: z.ZodString;
                updatedAt: z.ZodString;
                deactivatedAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, "strip", z.ZodTypeAny, {
                id: string;
                name: string;
                createdAt: string;
                updatedAt: string;
                normalizedName: string;
                isActive: boolean;
                brandId: string;
                deactivatedAt?: string | null | undefined;
                brandName?: string | undefined;
                modelNumber?: string | null | undefined;
            }, {
                id: string;
                name: string;
                createdAt: string;
                updatedAt: string;
                normalizedName: string;
                isActive: boolean;
                brandId: string;
                deactivatedAt?: string | null | undefined;
                brandName?: string | undefined;
                modelNumber?: string | null | undefined;
            }>, "many">>;
            suggestedBrandName: z.ZodOptional<z.ZodString>;
            suggestedModelName: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            status: "matched" | "missing_model" | "missing_brand" | "ambiguous";
            rawInput: string;
            matchedModel?: {
                id: string;
                name: string;
                createdAt: string;
                updatedAt: string;
                normalizedName: string;
                isActive: boolean;
                brandId: string;
                deactivatedAt?: string | null | undefined;
                brandName?: string | undefined;
                modelNumber?: string | null | undefined;
            } | null | undefined;
            candidateModels?: {
                id: string;
                name: string;
                createdAt: string;
                updatedAt: string;
                normalizedName: string;
                isActive: boolean;
                brandId: string;
                deactivatedAt?: string | null | undefined;
                brandName?: string | undefined;
                modelNumber?: string | null | undefined;
            }[] | undefined;
            suggestedBrandName?: string | undefined;
            suggestedModelName?: string | undefined;
        }, {
            status: "matched" | "missing_model" | "missing_brand" | "ambiguous";
            rawInput: string;
            matchedModel?: {
                id: string;
                name: string;
                createdAt: string;
                updatedAt: string;
                normalizedName: string;
                isActive: boolean;
                brandId: string;
                deactivatedAt?: string | null | undefined;
                brandName?: string | undefined;
                modelNumber?: string | null | undefined;
            } | null | undefined;
            candidateModels?: {
                id: string;
                name: string;
                createdAt: string;
                updatedAt: string;
                normalizedName: string;
                isActive: boolean;
                brandId: string;
                deactivatedAt?: string | null | undefined;
                brandName?: string | undefined;
                modelNumber?: string | null | undefined;
            }[] | undefined;
            suggestedBrandName?: string | undefined;
            suggestedModelName?: string | undefined;
        }>, "many">;
        valid: z.ZodBoolean;
        errorMessage: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        valid: boolean;
        models: {
            status: "matched" | "missing_model" | "missing_brand" | "ambiguous";
            rawInput: string;
            matchedModel?: {
                id: string;
                name: string;
                createdAt: string;
                updatedAt: string;
                normalizedName: string;
                isActive: boolean;
                brandId: string;
                deactivatedAt?: string | null | undefined;
                brandName?: string | undefined;
                modelNumber?: string | null | undefined;
            } | null | undefined;
            candidateModels?: {
                id: string;
                name: string;
                createdAt: string;
                updatedAt: string;
                normalizedName: string;
                isActive: boolean;
                brandId: string;
                deactivatedAt?: string | null | undefined;
                brandName?: string | undefined;
                modelNumber?: string | null | undefined;
            }[] | undefined;
            suggestedBrandName?: string | undefined;
            suggestedModelName?: string | undefined;
        }[];
        lineNumber: number;
        rawLine: string;
        errorMessage?: string | null | undefined;
    }, {
        valid: boolean;
        models: {
            status: "matched" | "missing_model" | "missing_brand" | "ambiguous";
            rawInput: string;
            matchedModel?: {
                id: string;
                name: string;
                createdAt: string;
                updatedAt: string;
                normalizedName: string;
                isActive: boolean;
                brandId: string;
                deactivatedAt?: string | null | undefined;
                brandName?: string | undefined;
                modelNumber?: string | null | undefined;
            } | null | undefined;
            candidateModels?: {
                id: string;
                name: string;
                createdAt: string;
                updatedAt: string;
                normalizedName: string;
                isActive: boolean;
                brandId: string;
                deactivatedAt?: string | null | undefined;
                brandName?: string | undefined;
                modelNumber?: string | null | undefined;
            }[] | undefined;
            suggestedBrandName?: string | undefined;
            suggestedModelName?: string | undefined;
        }[];
        lineNumber: number;
        rawLine: string;
        errorMessage?: string | null | undefined;
    }>, "many">;
    totalGroups: z.ZodNumber;
    missingBrands: z.ZodArray<z.ZodString, "many">;
    missingModels: z.ZodArray<z.ZodObject<{
        brandName: z.ZodString;
        modelName: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        brandName: string;
        modelName: string;
    }, {
        brandName: string;
        modelName: string;
    }>, "many">;
    ambiguousModels: z.ZodArray<z.ZodObject<{
        rawInput: z.ZodString;
        candidates: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            brandId: z.ZodString;
            brandName: z.ZodOptional<z.ZodString>;
            name: z.ZodString;
            normalizedName: z.ZodString;
            modelNumber: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            isActive: z.ZodBoolean;
            createdAt: z.ZodString;
            updatedAt: z.ZodString;
            deactivatedAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            name: string;
            createdAt: string;
            updatedAt: string;
            normalizedName: string;
            isActive: boolean;
            brandId: string;
            deactivatedAt?: string | null | undefined;
            brandName?: string | undefined;
            modelNumber?: string | null | undefined;
        }, {
            id: string;
            name: string;
            createdAt: string;
            updatedAt: string;
            normalizedName: string;
            isActive: boolean;
            brandId: string;
            deactivatedAt?: string | null | undefined;
            brandName?: string | undefined;
            modelNumber?: string | null | undefined;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        rawInput: string;
        candidates: {
            id: string;
            name: string;
            createdAt: string;
            updatedAt: string;
            normalizedName: string;
            isActive: boolean;
            brandId: string;
            deactivatedAt?: string | null | undefined;
            brandName?: string | undefined;
            modelNumber?: string | null | undefined;
        }[];
    }, {
        rawInput: string;
        candidates: {
            id: string;
            name: string;
            createdAt: string;
            updatedAt: string;
            normalizedName: string;
            isActive: boolean;
            brandId: string;
            deactivatedAt?: string | null | undefined;
            brandName?: string | undefined;
            modelNumber?: string | null | undefined;
        }[];
    }>, "many">;
    conflicts: z.ZodArray<z.ZodObject<{
        modelId: z.ZodString;
        modelName: z.ZodString;
        brandName: z.ZodString;
        existingGroupId: z.ZodString;
        proposedLineNumber: z.ZodNumber;
        existingGroupMemberCount: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        brandName: string;
        modelId: string;
        modelName: string;
        existingGroupId: string;
        proposedLineNumber: number;
        existingGroupMemberCount: number;
    }, {
        brandName: string;
        modelId: string;
        modelName: string;
        existingGroupId: string;
        proposedLineNumber: number;
        existingGroupMemberCount: number;
    }>, "many">;
    canPublishImmediately: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    categoryId: string;
    categoryName: string;
    previewId: string;
    lines: {
        valid: boolean;
        models: {
            status: "matched" | "missing_model" | "missing_brand" | "ambiguous";
            rawInput: string;
            matchedModel?: {
                id: string;
                name: string;
                createdAt: string;
                updatedAt: string;
                normalizedName: string;
                isActive: boolean;
                brandId: string;
                deactivatedAt?: string | null | undefined;
                brandName?: string | undefined;
                modelNumber?: string | null | undefined;
            } | null | undefined;
            candidateModels?: {
                id: string;
                name: string;
                createdAt: string;
                updatedAt: string;
                normalizedName: string;
                isActive: boolean;
                brandId: string;
                deactivatedAt?: string | null | undefined;
                brandName?: string | undefined;
                modelNumber?: string | null | undefined;
            }[] | undefined;
            suggestedBrandName?: string | undefined;
            suggestedModelName?: string | undefined;
        }[];
        lineNumber: number;
        rawLine: string;
        errorMessage?: string | null | undefined;
    }[];
    totalGroups: number;
    missingBrands: string[];
    missingModels: {
        brandName: string;
        modelName: string;
    }[];
    ambiguousModels: {
        rawInput: string;
        candidates: {
            id: string;
            name: string;
            createdAt: string;
            updatedAt: string;
            normalizedName: string;
            isActive: boolean;
            brandId: string;
            deactivatedAt?: string | null | undefined;
            brandName?: string | undefined;
            modelNumber?: string | null | undefined;
        }[];
    }[];
    conflicts: {
        brandName: string;
        modelId: string;
        modelName: string;
        existingGroupId: string;
        proposedLineNumber: number;
        existingGroupMemberCount: number;
    }[];
    canPublishImmediately: boolean;
}, {
    categoryId: string;
    categoryName: string;
    previewId: string;
    lines: {
        valid: boolean;
        models: {
            status: "matched" | "missing_model" | "missing_brand" | "ambiguous";
            rawInput: string;
            matchedModel?: {
                id: string;
                name: string;
                createdAt: string;
                updatedAt: string;
                normalizedName: string;
                isActive: boolean;
                brandId: string;
                deactivatedAt?: string | null | undefined;
                brandName?: string | undefined;
                modelNumber?: string | null | undefined;
            } | null | undefined;
            candidateModels?: {
                id: string;
                name: string;
                createdAt: string;
                updatedAt: string;
                normalizedName: string;
                isActive: boolean;
                brandId: string;
                deactivatedAt?: string | null | undefined;
                brandName?: string | undefined;
                modelNumber?: string | null | undefined;
            }[] | undefined;
            suggestedBrandName?: string | undefined;
            suggestedModelName?: string | undefined;
        }[];
        lineNumber: number;
        rawLine: string;
        errorMessage?: string | null | undefined;
    }[];
    totalGroups: number;
    missingBrands: string[];
    missingModels: {
        brandName: string;
        modelName: string;
    }[];
    ambiguousModels: {
        rawInput: string;
        candidates: {
            id: string;
            name: string;
            createdAt: string;
            updatedAt: string;
            normalizedName: string;
            isActive: boolean;
            brandId: string;
            deactivatedAt?: string | null | undefined;
            brandName?: string | undefined;
            modelNumber?: string | null | undefined;
        }[];
    }[];
    conflicts: {
        brandName: string;
        modelId: string;
        modelName: string;
        existingGroupId: string;
        proposedLineNumber: number;
        existingGroupMemberCount: number;
    }[];
    canPublishImmediately: boolean;
}>;
export type ParsePreviewResponse = z.infer<typeof ParsePreviewResponseSchema>;
export declare const ConflictActionSchema: z.ZodEnum<["merge", "cancel"]>;
export type ConflictAction = z.infer<typeof ConflictActionSchema>;
export declare const PublishCompatibilityRequestSchema: z.ZodObject<{
    previewId: z.ZodOptional<z.ZodString>;
    categoryId: z.ZodString;
    lines: z.ZodArray<z.ZodObject<{
        models: z.ZodArray<z.ZodObject<{
            brandName: z.ZodString;
            modelName: z.ZodString;
            modelNumber: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            createIfMissing: z.ZodDefault<z.ZodBoolean>;
            resolvedModelId: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            brandName: string;
            modelName: string;
            createIfMissing: boolean;
            modelNumber?: string | null | undefined;
            resolvedModelId?: string | undefined;
        }, {
            brandName: string;
            modelName: string;
            modelNumber?: string | null | undefined;
            createIfMissing?: boolean | undefined;
            resolvedModelId?: string | undefined;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        models: {
            brandName: string;
            modelName: string;
            createIfMissing: boolean;
            modelNumber?: string | null | undefined;
            resolvedModelId?: string | undefined;
        }[];
    }, {
        models: {
            brandName: string;
            modelName: string;
            modelNumber?: string | null | undefined;
            createIfMissing?: boolean | undefined;
            resolvedModelId?: string | undefined;
        }[];
    }>, "many">;
    conflictResolutions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodEnum<["merge", "cancel"]>>>;
}, "strip", z.ZodTypeAny, {
    categoryId: string;
    lines: {
        models: {
            brandName: string;
            modelName: string;
            createIfMissing: boolean;
            modelNumber?: string | null | undefined;
            resolvedModelId?: string | undefined;
        }[];
    }[];
    previewId?: string | undefined;
    conflictResolutions?: Record<string, "merge" | "cancel"> | undefined;
}, {
    categoryId: string;
    lines: {
        models: {
            brandName: string;
            modelName: string;
            modelNumber?: string | null | undefined;
            createIfMissing?: boolean | undefined;
            resolvedModelId?: string | undefined;
        }[];
    }[];
    previewId?: string | undefined;
    conflictResolutions?: Record<string, "merge" | "cancel"> | undefined;
}>;
export type PublishCompatibilityRequest = z.infer<typeof PublishCompatibilityRequestSchema>;
export declare const IssueReportTypeSchema: z.ZodEnum<["incorrect_compatibility", "wrong_mobile_model", "missing_compatible_model", "other"]>;
export type IssueReportType = z.infer<typeof IssueReportTypeSchema>;
export declare const IssueReportStatusSchema: z.ZodEnum<["open", "reviewing", "resolved", "rejected"]>;
export type IssueReportStatus = z.infer<typeof IssueReportStatusSchema>;
export declare const CreateIssueReportRequestSchema: z.ZodObject<{
    type: z.ZodEnum<["incorrect_compatibility", "wrong_mobile_model", "missing_compatible_model", "other"]>;
    categoryId: z.ZodOptional<z.ZodString>;
    modelId: z.ZodOptional<z.ZodString>;
    groupId: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "incorrect_compatibility" | "wrong_mobile_model" | "missing_compatible_model" | "other";
    modelId?: string | undefined;
    categoryId?: string | undefined;
    groupId?: string | undefined;
    description?: string | undefined;
}, {
    type: "incorrect_compatibility" | "wrong_mobile_model" | "missing_compatible_model" | "other";
    modelId?: string | undefined;
    categoryId?: string | undefined;
    groupId?: string | undefined;
    description?: string | undefined;
}>;
export type CreateIssueReportRequest = z.infer<typeof CreateIssueReportRequestSchema>;
export declare const IssueReportSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodNullable<z.ZodString>;
    type: z.ZodEnum<["incorrect_compatibility", "wrong_mobile_model", "missing_compatible_model", "other"]>;
    categoryId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    categoryName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    modelId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    modelName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    groupId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    status: z.ZodEnum<["open", "reviewing", "resolved", "rejected"]>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "incorrect_compatibility" | "wrong_mobile_model" | "missing_compatible_model" | "other";
    status: "open" | "reviewing" | "resolved" | "rejected";
    id: string;
    createdAt: string;
    updatedAt: string;
    userId: string | null;
    modelId?: string | null | undefined;
    modelName?: string | null | undefined;
    categoryId?: string | null | undefined;
    categoryName?: string | null | undefined;
    groupId?: string | null | undefined;
    description?: string | null | undefined;
}, {
    type: "incorrect_compatibility" | "wrong_mobile_model" | "missing_compatible_model" | "other";
    status: "open" | "reviewing" | "resolved" | "rejected";
    id: string;
    createdAt: string;
    updatedAt: string;
    userId: string | null;
    modelId?: string | null | undefined;
    modelName?: string | null | undefined;
    categoryId?: string | null | undefined;
    categoryName?: string | null | undefined;
    groupId?: string | null | undefined;
    description?: string | null | undefined;
}>;
export type IssueReport = z.infer<typeof IssueReportSchema>;
export declare const ModelRequestStatusSchema: z.ZodEnum<["pending", "approved", "rejected"]>;
export type ModelRequestStatus = z.infer<typeof ModelRequestStatusSchema>;
export declare const CreateModelRequestSchema: z.ZodObject<{
    brandName: z.ZodString;
    modelName: z.ZodString;
    modelNumber: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    brandName: string;
    modelName: string;
    modelNumber?: string | undefined;
    notes?: string | undefined;
}, {
    brandName: string;
    modelName: string;
    modelNumber?: string | undefined;
    notes?: string | undefined;
}>;
export type CreateModelRequest = z.infer<typeof CreateModelRequestSchema>;
export declare const ModelRequestItemSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodNullable<z.ZodString>;
    brandNameSubmitted: z.ZodString;
    modelNameSubmitted: z.ZodString;
    modelNumberSubmitted: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    notes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    status: z.ZodEnum<["pending", "approved", "rejected"]>;
    reviewedByAdminId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    reviewedAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    status: "rejected" | "pending" | "approved";
    id: string;
    createdAt: string;
    updatedAt: string;
    userId: string | null;
    brandNameSubmitted: string;
    modelNameSubmitted: string;
    notes?: string | null | undefined;
    modelNumberSubmitted?: string | null | undefined;
    reviewedByAdminId?: string | null | undefined;
    reviewedAt?: string | null | undefined;
}, {
    status: "rejected" | "pending" | "approved";
    id: string;
    createdAt: string;
    updatedAt: string;
    userId: string | null;
    brandNameSubmitted: string;
    modelNameSubmitted: string;
    notes?: string | null | undefined;
    modelNumberSubmitted?: string | null | undefined;
    reviewedByAdminId?: string | null | undefined;
    reviewedAt?: string | null | undefined;
}>;
export type ModelRequestItem = z.infer<typeof ModelRequestItemSchema>;
export declare const AdminAllowlistEntrySchema: z.ZodObject<{
    id: z.ZodString;
    emailNormalized: z.ZodString;
    addedByAdminId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: string;
    emailNormalized: string;
    addedByAdminId?: string | null | undefined;
}, {
    id: string;
    createdAt: string;
    emailNormalized: string;
    addedByAdminId?: string | null | undefined;
}>;
export type AdminAllowlistEntry = z.infer<typeof AdminAllowlistEntrySchema>;
export declare const AddAdminAllowlistRequestSchema: z.ZodObject<{
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
}, {
    email: string;
}>;
export type AddAdminAllowlistRequest = z.infer<typeof AddAdminAllowlistRequestSchema>;
export declare const AppConfigResponseSchema: z.ZodObject<{
    isMaintenanceMode: z.ZodBoolean;
    maintenanceMessage: z.ZodString;
    minUserAppVersion: z.ZodString;
    latestUserAppVersion: z.ZodString;
    userAppUpdateUrl: z.ZodString;
    minAdminAppVersion: z.ZodString;
    latestAdminAppVersion: z.ZodString;
    adminAppUpdateUrl: z.ZodString;
    termsUrl: z.ZodString;
    privacyPolicyUrl: z.ZodString;
    accountDeletionUrl: z.ZodString;
}, "strip", z.ZodTypeAny, {
    isMaintenanceMode: boolean;
    maintenanceMessage: string;
    minUserAppVersion: string;
    latestUserAppVersion: string;
    userAppUpdateUrl: string;
    minAdminAppVersion: string;
    latestAdminAppVersion: string;
    adminAppUpdateUrl: string;
    termsUrl: string;
    privacyPolicyUrl: string;
    accountDeletionUrl: string;
}, {
    isMaintenanceMode: boolean;
    maintenanceMessage: string;
    minUserAppVersion: string;
    latestUserAppVersion: string;
    userAppUpdateUrl: string;
    minAdminAppVersion: string;
    latestAdminAppVersion: string;
    adminAppUpdateUrl: string;
    termsUrl: string;
    privacyPolicyUrl: string;
    accountDeletionUrl: string;
}>;
export type AppConfigResponse = z.infer<typeof AppConfigResponseSchema>;
//# sourceMappingURL=types.d.ts.map