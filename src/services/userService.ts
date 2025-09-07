import { supabase } from "@/integrations/supabase/client";
import { User } from "@/types";
import { validateCPF, formatCPF } from "@/utils/cpfUtils";

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;
    
    const { data, error } = await supabase
      .from("poupeja_users")
      .select("*")
      .eq("id", user.id)
      .single();
    
    if (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
    
    return {
      id: data.id,
      name: data.name || user.email?.split('@')[0] || "Usuário",
      email: data.email || user.email || "",
      profileImage: data.profile_image,
      phone: data.phone || "",
      cpf: data.cpf || "",
      birthDate: data.birth_date || "",
      cep: data.cep || "",
      logradouro: data.logradouro || "",
      numero: data.numero || "",
      complemento: data.complemento || "",
      bairro: data.bairro || "",
      cidade: data.cidade || "",
      estado: data.estado || "",
      currentPlanType: data.current_plan_type || "free",
      achievements: [] // Return empty array since achievements tables don't exist yet
    };
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
};

export const updateUserProfile = async (
  userData: Partial<{ 
    name: string; 
    profileImage: string; 
    phone: string; 
    cpf: string; 
    birthDate: string; 
    cep: string;
    logradouro: string;
    numero: string;
    complemento: string;
    bairro: string;
    cidade: string;
    estado: string;
  }>
): Promise<User | null> => {
  try {
    console.log('userService: Updating user profile with data:', userData);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('userService: No authenticated user found');
      return null;
    }
    
    // Map camelCase to snake_case for database
    const updateData: any = {};
    if (userData.name !== undefined) updateData.name = userData.name;
    if (userData.profileImage !== undefined) updateData.profile_image = userData.profileImage;
    if (userData.phone !== undefined) updateData.phone = userData.phone;
    if (userData.cpf !== undefined) updateData.cpf = userData.cpf;
    if (userData.birthDate !== undefined) updateData.birth_date = userData.birthDate;
    if (userData.cep !== undefined) updateData.cep = userData.cep;
    if (userData.logradouro !== undefined) updateData.logradouro = userData.logradouro;
    if (userData.numero !== undefined) updateData.numero = userData.numero;
    if (userData.complemento !== undefined) updateData.complemento = userData.complemento;
    if (userData.bairro !== undefined) updateData.bairro = userData.bairro;
    if (userData.cidade !== undefined) updateData.cidade = userData.cidade;
    if (userData.estado !== undefined) updateData.estado = userData.estado;
    
    console.log('userService: Updating database with mapped data:', updateData);
    
    const { data, error } = await supabase
      .from("poupeja_users")
      .update(updateData)
      .eq("id", user.id)
      .select()
      .single();
    
    if (error) {
      console.error('userService: Database update error:', error);
      throw error;
    }
    
    console.log('userService: Profile updated successfully:', data);
    
    // Map snake_case back to camelCase for return
    return {
      id: data.id,
      name: data.name || user.email?.split('@')[0] || "Usuário",
      email: data.email || user.email || "",
      profileImage: data.profile_image,
      phone: data.phone || "",
      cpf: data.cpf || "",
      birthDate: data.birth_date || "",
      cep: data.cep || "",
      logradouro: data.logradouro || "",
      numero: data.numero || "",
      complemento: data.complemento || "",
      bairro: data.bairro || "",
      cidade: data.cidade || "",
      estado: data.estado || "",
      currentPlanType: data.current_plan_type || "free",
      achievements: [] // Return empty array since achievements tables don't exist yet
    };
  } catch (error) {
    console.error("userService: Error updating user profile:", error);
    return null;
  }
};

export const getUserAchievements = async (): Promise<any[]> => {
  try {
    // Since achievements tables don't exist yet, return empty array
    // This can be implemented later when the achievements feature is fully developed
    return [];
  } catch (error) {
    console.error("Error fetching user achievements:", error);
    return [];
  }
};