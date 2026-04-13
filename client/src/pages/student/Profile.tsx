import { useState, useEffect } from "react";
import { StudentLayout } from "@/components/layout/StudentLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Check, User, Phone, MapPin, School, BookOpen } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useSocketEvent, useJoinUserRoom } from "@/hooks/use-socket";

export default function StudentProfile() {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const { data: profile, isLoading } = useQuery<any>({
    queryKey: ["/api/student/profile"],
  });

  // Join personal socket room so server can send targeted messages
  useJoinUserRoom(user?.id);

  // Listen for real-time 'profile-updated' events pushed by the server
  // when an admin approves/rejects the enrollment and assigns a Student ID.
  useSocketEvent("announcement", (data) => {
    if (data?.type === "profile-updated") {
      queryClient.invalidateQueries({ queryKey: ["/api/student/profile"] });
    }
  });

  const [formData, setFormData] = useState({
    firstName: user?.username || "",
    lastName: "Student",
    middleName: "",
    extraName: "",
    address: "",
    dateOfBirth: "",
    placeOfBirth: "",
    gender: "",
    religion: "",
    nationality: "Filipino",
    civilStatus: "",
    mobileNumber: "",
    email: "",
    
    fatherName: "",
    fatherOccupation: "",
    fatherContact: "",
    motherName: "",
    motherOccupation: "",
    motherContact: "",
    
    guardianName: "",
    guardianRelationship: "",
    guardianContact: "",
    
    elementarySchool: "",
    elementaryYear: "",
    highSchool: "",
    highSchoolYear: "",
    seniorHighSchool: "",
    seniorHighSchoolYear: "",
    
    photoUrl: "",
    diplomaUrl: "",
    form138Url: "",
    goodMoralUrl: "",
    psaUrl: "",
  });

  const [uploadingField, setUploadingField] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.student) {
      const s = profile.student;
      setFormData(prev => ({
        ...prev,
        ...s,
        firstName: s.firstName || prev.firstName,
        lastName: s.lastName || prev.lastName,
        nationality: s.nationality || prev.nationality,
      }));
    }
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/student/profile", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your personal information has been successfully saved.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/student/profile"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: string, value: string) => {
    // Automatically capitalize all text inputs as requested in registration
    const capitalizedValue = value.toUpperCase();
    setFormData(prev => ({ ...prev, [field]: capitalizedValue }));
  };

  const handleFileUpload = async (field: string, file: File) => {
    setUploadingField(field);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formDataUpload,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      handleInputChange(field, data.url);
      toast({
        title: "Upload successful",
        description: `${field.replace(/Url$/, "")} has been uploaded.`,
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "There was an error uploading your file.",
        variant: "destructive",
      });
    } finally {
      setUploadingField(null);
    }
  };

  const setNA = (field: string) => {
    handleInputChange(field, "N/A");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="max-w-5xl mx-auto space-y-8 pb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 font-serif">My Profile</h1>
            <p className="text-muted-foreground">Update your personal information and contact details.</p>
          </div>
          {profile?.student?.status && (
            <div className="bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold capitalize">
              Status: {profile.student.status}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="border-none shadow-xl overflow-hidden bg-white">
            <div className="h-2 bg-gradient-to-r from-primary via-blue-600 to-indigo-600" />
            
            <CardHeader className="border-b bg-slate-50/50 pb-8">
              <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                {/* Photo area */}
                <div className="w-32 h-32 border-2 border-dashed border-slate-300 rounded overflow-hidden flex flex-col items-center justify-center bg-white shrink-0 relative hover:border-primary transition-colors cursor-pointer group">
                  <input 
                    type="file" 
                    className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload("photoUrl", file);
                    }}
                  />
                  {formData.photoUrl ? (
                    <img 
                      src={formData.photoUrl} 
                      alt="Student" 
                      className="w-full h-full object-cover" 
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        console.warn("Profile photo missing from server");
                      }}
                    />
                  ) : (
                    <>
                      <User className="h-10 w-10 text-slate-300 group-hover:text-primary transition-colors" />
                      <span className="text-[10px] font-bold text-slate-400 mt-2 uppercase text-center px-2">Update 2x2 Photo</span>
                    </>
                  )}
                  {uploadingField === "photoUrl" && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-20">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 space-y-2 text-center md:text-left">
                  <CardTitle className="text-2xl font-serif">Personal Information</CardTitle>
                  <CardDescription>Make sure your information is accurate and up to date.</CardDescription>
                  {profile?.student?.studentId && (
                    <div className="mt-4 inline-block font-mono bg-slate-900 text-white px-3 py-1 rounded text-sm">
                      ID: {profile.student.studentId}
                    </div>
                  )}
                </div>
                
                <div className="md:self-start">
                  <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={updateProfileMutation.isPending}>
                    {updateProfileMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-8 space-y-10">
              {/* Personal Data */}
              <section className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <User className="h-5 w-5 text-primary" />
                  <h3 className="font-bold text-slate-800">Personal Details</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <Label>Last Name</Label>
                    <Input className="uppercase" value={formData.lastName} onChange={(e) => handleInputChange("lastName", e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>First Name</Label>
                    <Input className="uppercase" value={formData.firstName} onChange={(e) => handleInputChange("firstName", e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>Middle Name</Label>
                      <button type="button" onClick={() => setNA("middleName")} className="text-[10px] text-primary hover:underline font-bold uppercase">N/A</button>
                    </div>
                    <Input className="uppercase" value={formData.middleName} placeholder='Put "N/A" if none' onChange={(e) => handleInputChange("middleName", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>Extension (Jr/III)</Label>
                      <button type="button" onClick={() => setNA("extraName")} className="text-[10px] text-primary hover:underline font-bold uppercase">N/A</button>
                    </div>
                    <Input className="uppercase" value={formData.extraName} placeholder='Put "N/A" if none' onChange={(e) => handleInputChange("extraName", e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label>Date of Birth</Label>
                    <Input type="date" value={formData.dateOfBirth} onChange={(e) => handleInputChange("dateOfBirth", e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Place of Birth</Label>
                    <Input className="uppercase" value={formData.placeOfBirth} placeholder="City/Provincial" onChange={(e) => handleInputChange("placeOfBirth", e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <Select value={formData.gender} onValueChange={(val) => handleInputChange("gender", val)}>
                      <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label>Religion</Label>
                    <Input className="uppercase" value={formData.religion} onChange={(e) => handleInputChange("religion", e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Nationality</Label>
                    <Input className="uppercase" value={formData.nationality} onChange={(e) => handleInputChange("nationality", e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Civil Status</Label>
                    <Select value={formData.civilStatus} onValueChange={(val) => handleInputChange("civilStatus", val)}>
                      <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Single">Single</SelectItem>
                        <SelectItem value="Married">Married</SelectItem>
                        <SelectItem value="Widowed">Widowed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </section>

              {/* Contact Data */}
              <section className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Phone className="h-5 w-5 text-primary" />
                  <h3 className="font-bold text-slate-800">Contact Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Mobile Number</Label>
                    <Input className="uppercase" placeholder="0917-000-0000" value={formData.mobileNumber} onChange={(e) => handleInputChange("mobileNumber", e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Email Address</Label>
                    <Input className="uppercase" type="email" placeholder="EXAMPLE@EMAIL.COM" value={formData.email} onChange={(e) => handleInputChange("email", e.target.value)} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Home Address</Label>
                  <Input className="uppercase" placeholder="Street, Barangay, City/Municipality, Province" value={formData.address} onChange={(e) => handleInputChange("address", e.target.value)} required />
                </div>
              </section>

              {/* Family Data */}
              <section className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <MapPin className="h-5 w-5 text-primary" />
                  <h3 className="font-bold text-slate-800">Family Information</h3>
                </div>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label>Father's Full Name</Label>
                        <button type="button" onClick={() => setNA("fatherName")} className="text-[10px] text-primary hover:underline font-bold uppercase">N/A</button>
                      </div>
                      <Input className="uppercase" value={formData.fatherName} placeholder='Put "N/A" if not available' onChange={(e) => handleInputChange("fatherName", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label>Occupation</Label>
                        <button type="button" onClick={() => setNA("fatherOccupation")} className="text-[10px] text-primary hover:underline font-bold uppercase">N/A</button>
                      </div>
                      <Input className="uppercase" value={formData.fatherOccupation} onChange={(e) => handleInputChange("fatherOccupation", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label>Contact Number</Label>
                        <button type="button" onClick={() => setNA("fatherContact")} className="text-[10px] text-primary hover:underline font-bold uppercase">N/A</button>
                      </div>
                      <Input className="uppercase" value={formData.fatherContact} onChange={(e) => handleInputChange("fatherContact", e.target.value)} />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label>Mother's Full Name</Label>
                        <button type="button" onClick={() => setNA("motherName")} className="text-[10px] text-primary hover:underline font-bold uppercase">N/A</button>
                      </div>
                      <Input className="uppercase" value={formData.motherName} placeholder='Put "N/A" if not available' onChange={(e) => handleInputChange("motherName", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label>Occupation</Label>
                        <button type="button" onClick={() => setNA("motherOccupation")} className="text-[10px] text-primary hover:underline font-bold uppercase">N/A</button>
                      </div>
                      <Input className="uppercase" value={formData.motherOccupation} onChange={(e) => handleInputChange("motherOccupation", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label>Contact Number</Label>
                        <button type="button" onClick={() => setNA("motherContact")} className="text-[10px] text-primary hover:underline font-bold uppercase">N/A</button>
                      </div>
                      <Input className="uppercase" value={formData.motherContact} onChange={(e) => handleInputChange("motherContact", e.target.value)} />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-6 rounded-lg border">
                    <div className="space-y-2">
                      <Label>Guardian's Full Name</Label>
                      <Input className="uppercase" placeholder="In case of emergency" value={formData.guardianName} onChange={(e) => handleInputChange("guardianName", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Relationship</Label>
                      <Input className="uppercase" value={formData.guardianRelationship} onChange={(e) => handleInputChange("guardianRelationship", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Contact Number</Label>
                      <Input className="uppercase" value={formData.guardianContact} onChange={(e) => handleInputChange("guardianContact", e.target.value)} />
                    </div>
                  </div>
                </div>
              </section>

              {/* Educational Data */}
              <section className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <School className="h-5 w-5 text-primary" />
                  <h3 className="font-bold text-slate-800">Educational Background</h3>
                </div>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="md:col-span-3 space-y-2">
                      <Label>Elementary School</Label>
                      <Input className="uppercase" value={formData.elementarySchool} onChange={(e) => handleInputChange("elementarySchool", e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Year Graduated</Label>
                      <Input className="uppercase" placeholder="yyyy" value={formData.elementaryYear} onChange={(e) => handleInputChange("elementaryYear", e.target.value)} required />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="md:col-span-3 space-y-2">
                      <Label>High School (JHS)</Label>
                      <Input className="uppercase" value={formData.highSchool} onChange={(e) => handleInputChange("highSchool", e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Year Graduated</Label>
                      <Input className="uppercase" placeholder="yyyy" value={formData.highSchoolYear} onChange={(e) => handleInputChange("highSchoolYear", e.target.value)} required />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="md:col-span-3 space-y-2">
                      <div className="flex justify-between items-center">
                        <Label>Senior High School (SHS)</Label>
                        <button type="button" onClick={() => { setNA("seniorHighSchool"); setNA("seniorHighSchoolYear"); }} className="text-[10px] text-primary hover:underline font-bold uppercase">N/A</button>
                      </div>
                      <Input className="uppercase" value={formData.seniorHighSchool} placeholder='Put "N/A" if not applicable' onChange={(e) => handleInputChange("seniorHighSchool", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Year Graduated</Label>
                      <Input className="uppercase" placeholder="yyyy" value={formData.seniorHighSchoolYear} onChange={(e) => handleInputChange("seniorHighSchoolYear", e.target.value)} />
                    </div>
                  </div>
                </div>
              </section>
            </CardContent>
          </Card>
        </form>
      </div>
    </StudentLayout>
  );
}
