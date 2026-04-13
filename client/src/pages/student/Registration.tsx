import { useState, useEffect } from "react";
import { StudentLayout } from "@/components/layout/StudentLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, FileText, Check, ChevronRight, ChevronLeft, User, Phone, MapPin, School, BookOpen } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Course, Subject, SystemSettings } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

export default function StudentRegistration() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [enrolledSubjectIds, setEnrolledSubjectIds] = useState<string[]>([]);
  
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
    yearLevel: "1",
    semester: "1st Semester",
    academicYear: "2026-2027",
  });

  const [uploadingField, setUploadingField] = useState<string | null>(null);

  const { data: settings } = useQuery<SystemSettings>({
    queryKey: ["/api/settings"],
  });

  const { data: courses } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const { data: profile } = useQuery<any>({
    queryKey: ["/api/student/profile"],
  });

  const isReturningStudent = !!profile?.student?.studentId;

  useEffect(() => {
    if (profile?.student) {
      const s = profile.student;
      setFormData(prev => ({
        ...prev,
        ...s,
        firstName: s.firstName || prev.firstName,
        lastName: s.lastName || prev.lastName,
        yearLevel: s.yearLevel?.toString() || prev.yearLevel,
      }));
      if (s.courseId) setSelectedCourseId(s.courseId);
    }
  }, [profile]);

  useEffect(() => {
    if (settings) {
      setFormData(prev => ({
        ...prev,
        academicYear: settings.currentAcademicYear,
        semester: settings.currentSemester,
      }));
    }
  }, [settings]);

  const { data: subjects } = useQuery<Subject[]>({
    queryKey: ["/api/courses", selectedCourseId, "subjects"],
    enabled: !!selectedCourseId,
  });

  const enrollmentMutation = useMutation({
    mutationFn: async (data: any) => {
      // 1. Update Profile First
      await apiRequest("POST", "/api/student/profile", {
        ...formData,
        courseId: selectedCourseId,
        yearLevel: parseInt(formData.yearLevel),
      });
      
      // 2. Submit Enrollment
      const res = await apiRequest("POST", "/api/student/enroll", {
        academicYear: formData.academicYear,
        semester: formData.semester,
        subjectIds: enrolledSubjectIds,
        yearLevel: parseInt(formData.yearLevel),
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Registration Submitted!",
        description: "Your enrollment application has been sent to the registrar for approval.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/student/enrollment"] });
      setLocation("/student/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "Submission failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: string, value: string) => {
    // Automatically capitalize all text inputs as requested
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

  const validateStep = (currentStep: number) => {
    if (currentStep === 1) {
      const requiredFields = [
        "firstName", "lastName", "dateOfBirth", "placeOfBirth", "gender", 
        "religion", "nationality", "civilStatus", "mobileNumber", "email", "address",
        "elementarySchool", "elementaryYear", "highSchool", "highSchoolYear"
      ];
      
      for (const field of requiredFields) {
        if (!formData[field as keyof typeof formData]) {
          const fieldName = field.replace(/([A-Z])/g, ' $1').toLowerCase();
          toast({ 
            title: "Required field", 
            description: `Please fill out your ${fieldName}. Use "N/A" if not applicable.`, 
            variant: "destructive" 
          });
          return false;
        }
      }
      return true;
    }
    
    if (currentStep === 2) {
      if (!selectedCourseId) {
        toast({ title: "Course required", description: "Please select an academic program.", variant: "destructive" });
        return false;
      }
      if (enrolledSubjectIds.length === 0) {
        toast({ title: "Subjects required", description: "Please select at least one subject.", variant: "destructive" });
        return false;
      }
      return true;
    }
    
    if (currentStep === 3) {
      if (isReturningStudent) return true;
      
      const requiredDocs = ["diplomaUrl", "form138Url", "goodMoralUrl", "psaUrl"];
      for (const doc of requiredDocs) {
        if (!formData[doc as keyof typeof formData]) {
          toast({ 
            title: "Document required", 
            description: `Please upload your ${doc.replace("Url", "").replace(/([A-Z])/g, ' $1')}.`, 
            variant: "destructive" 
          });
          return false;
        }
      }
      return true;
    }
    
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
      window.scrollTo(0, 0);
    }
  };
  const handleBack = () => {
    setStep(step - 1);
    window.scrollTo(0, 0);
  };

  const setNA = (field: string) => {
    handleInputChange(field, "N/A");
  };

  const handleSubmit = () => {
    if (!selectedCourseId) {
      toast({ title: "Course required", description: "Please select an academic program.", variant: "destructive" });
      return;
    }
    if (enrolledSubjectIds.length === 0) {
      toast({ title: "Subjects required", description: "Please select at least one subject.", variant: "destructive" });
      return;
    }
    enrollmentMutation.mutate({});
  };

  const toggleSubject = (id: string) => {
    setEnrolledSubjectIds(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  return (
    <StudentLayout>
      <div className="max-w-5xl mx-auto space-y-8 pb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 font-serif">Online Student Registration</h1>
            <p className="text-muted-foreground">Please fill out the form carefully using standard information.</p>
          </div>
          <div className="bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold">
            A.Y. {settings?.currentAcademicYear || "2026-2027"} | {settings?.currentSemester || "1st Semester"}
          </div>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center">
              <div 
                className={`flex items-center justify-center w-10 h-10 rounded-full font-bold transition-all ${
                  step === i ? "ring-4 ring-primary/20 bg-primary text-white scale-110" : 
                  step > i ? "bg-green-600 text-white" : "bg-slate-200 text-slate-500"
                }`}
              >
                {step > i || (i === 3 && isReturningStudent) ? <Check className="h-5 w-5" /> : i}
              </div>
              <div className="mx-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                {i === 1 && "Personal Info"}
                {i === 2 && "Program & Subjects"}
                {i === 3 && (isReturningStudent ? "Documents" : "Documents")}
                {i === 4 && "Finalize"}
              </div>
              {i < 4 && (
                <div 
                  className={`w-12 h-1 mx-2 transition-colors ${
                    step > i ? "bg-green-600" : "bg-slate-200"
                  }`} 
                />
              )}
            </div>
          ))}
        </div>

        <Card className="border-none shadow-2xl overflow-hidden bg-white">
          <div className="h-2 bg-gradient-to-r from-primary via-blue-600 to-indigo-600" />
          
          {step === 1 && (
            <>
              {/* ── Form Header ── */}
              <CardHeader className="border-b bg-gradient-to-r from-primary/5 via-blue-50 to-indigo-50 pb-8">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  {/* 2x2 Photo Upload */}
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <div className="w-32 h-40 border-2 border-dashed border-primary/40 rounded-sm overflow-hidden flex flex-col items-center justify-center bg-white relative hover:border-primary transition-colors cursor-pointer group shadow-sm">
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
                            // If the image is missing (e.g. after a redeploy), clear the URL so the placeholder shows
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            // Show a console warning but don't break the UI
                            console.warn("Upload file missing - likely due to redeploy without persistent disk");
                          }}
                        />
                      ) : (
                        <>
                          <User className="h-10 w-10 text-slate-300 group-hover:text-primary transition-colors" />
                          <span className="text-[10px] font-bold text-slate-400 mt-2 uppercase text-center leading-tight px-2">Upload<br/>2×2 Photo</span>
                        </>
                      )}
                      {uploadingField === "photoUrl" && (
                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-20">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground text-center uppercase font-medium tracking-wide">Recent<br/>Photo</span>
                  </div>

                  <div className="flex-1">
                    <div className="border border-primary/20 rounded-md overflow-hidden bg-white shadow-sm">
                      {/* Form Title Banner */}
                      <div className="bg-primary px-5 py-3">
                        <p className="text-white font-bold uppercase tracking-widest text-sm">Enrollment Application Form</p>
                        <p className="text-primary-foreground/70 text-xs mt-0.5">A.Y. {settings?.currentAcademicYear || "2026-2027"} • Please write in BLOCK LETTERS</p>
                      </div>
                      <div className="px-5 py-4 space-y-1">
                        <p className="text-xs text-muted-foreground">
                          <span className="text-red-500 font-bold">*</span> Indicates required field. Write <strong>N/A</strong> if not applicable.
                        </p>
                        <CardTitle className="text-xl font-serif text-primary">I. Student Personal Information</CardTitle>
                        <CardDescription className="text-xs">Complete all sections accurately. Falsification of information may result in disqualification.</CardDescription>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {/* ── SECTION A: Personal Data ── */}
                <div className="border-b">
                  <div className="bg-slate-800 px-6 py-2 flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-slate-300" />
                    <span className="text-xs font-bold text-slate-200 uppercase tracking-widest">A. Personal Data</span>
                  </div>
                  <div className="p-6 space-y-5">
                    {/* Name Row */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                      <div className="md:col-span-3 space-y-1">
                        <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                          Last Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          className="uppercase border-b-2 border-t-0 border-x-0 rounded-none focus-visible:ring-0 focus-visible:border-primary bg-slate-50/50 font-medium"
                          value={formData.lastName}
                          onChange={(e) => handleInputChange("lastName", e.target.value)}
                          placeholder="DELA CRUZ"
                        />
                      </div>
                      <div className="md:col-span-3 space-y-1">
                        <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                          First Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          className="uppercase border-b-2 border-t-0 border-x-0 rounded-none focus-visible:ring-0 focus-visible:border-primary bg-slate-50/50 font-medium"
                          value={formData.firstName}
                          onChange={(e) => handleInputChange("firstName", e.target.value)}
                          placeholder="JUAN"
                        />
                      </div>
                      <div className="md:col-span-4 space-y-1">
                        <div className="flex justify-between items-center">
                          <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Middle Name</Label>
                          <button type="button" onClick={() => setNA("middleName")} className="text-[10px] text-primary hover:underline font-bold uppercase px-1">N/A</button>
                        </div>
                        <Input
                          className="uppercase border-b-2 border-t-0 border-x-0 rounded-none focus-visible:ring-0 focus-visible:border-primary bg-slate-50/50 font-medium"
                          value={formData.middleName}
                          placeholder="SANTOS"
                          onChange={(e) => handleInputChange("middleName", e.target.value)}
                        />
                      </div>
                      <div className="md:col-span-2 space-y-1">
                        <div className="flex justify-between items-center">
                          <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Ext. (Jr/III)</Label>
                          <button type="button" onClick={() => setNA("extraName")} className="text-[10px] text-primary hover:underline font-bold uppercase px-1">N/A</button>
                        </div>
                        <Input
                          className="uppercase border-b-2 border-t-0 border-x-0 rounded-none focus-visible:ring-0 focus-visible:border-primary bg-slate-50/50 font-medium"
                          value={formData.extraName}
                          placeholder="JR."
                          onChange={(e) => handleInputChange("extraName", e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Birth / Gender / Civil Status */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                          Date of Birth <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="date"
                          className="border-b-2 border-t-0 border-x-0 rounded-none focus-visible:ring-0 focus-visible:border-primary bg-slate-50/50"
                          value={formData.dateOfBirth}
                          onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                          Place of Birth <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          className="uppercase border-b-2 border-t-0 border-x-0 rounded-none focus-visible:ring-0 focus-visible:border-primary bg-slate-50/50"
                          value={formData.placeOfBirth}
                          placeholder="City/Municipality, Province"
                          onChange={(e) => handleInputChange("placeOfBirth", e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                          Gender <span className="text-red-500">*</span>
                        </Label>
                        <Select defaultValue={formData.gender} onValueChange={(val) => handleInputChange("gender", val)}>
                          <SelectTrigger className="border-b-2 border-t-0 border-x-0 rounded-none focus:ring-0 bg-slate-50/50">
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                            <SelectItem value="Other">Other / Prefer not to say</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Religion / Nationality / Civil Status */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                          Religion <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          className="uppercase border-b-2 border-t-0 border-x-0 rounded-none focus-visible:ring-0 focus-visible:border-primary bg-slate-50/50"
                          value={formData.religion}
                          onChange={(e) => handleInputChange("religion", e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                          Nationality <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          className="uppercase border-b-2 border-t-0 border-x-0 rounded-none focus-visible:ring-0 focus-visible:border-primary bg-slate-50/50"
                          value={formData.nationality}
                          onChange={(e) => handleInputChange("nationality", e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                          Civil Status <span className="text-red-500">*</span>
                        </Label>
                        <Select defaultValue={formData.civilStatus} onValueChange={(val) => handleInputChange("civilStatus", val)}>
                          <SelectTrigger className="border-b-2 border-t-0 border-x-0 rounded-none focus:ring-0 bg-slate-50/50">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Single">Single</SelectItem>
                            <SelectItem value="Married">Married</SelectItem>
                            <SelectItem value="Widowed">Widowed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── SECTION B: Contact Information ── */}
                <div className="border-b">
                  <div className="bg-slate-800 px-6 py-2 flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-slate-300" />
                    <span className="text-xs font-bold text-slate-200 uppercase tracking-widest">B. Contact Information</span>
                  </div>
                  <div className="p-6 space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                          Mobile Number <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          className="border-b-2 border-t-0 border-x-0 rounded-none focus-visible:ring-0 focus-visible:border-primary bg-slate-50/50"
                          placeholder="0917-000-0000"
                          value={formData.mobileNumber}
                          onChange={(e) => handleInputChange("mobileNumber", e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                          Email Address <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="email"
                          className="uppercase border-b-2 border-t-0 border-x-0 rounded-none focus-visible:ring-0 focus-visible:border-primary bg-slate-50/50"
                          placeholder="EXAMPLE@EMAIL.COM"
                          value={formData.email}
                          onChange={(e) => handleInputChange("email", e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                        Permanent Home Address <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        className="uppercase border-b-2 border-t-0 border-x-0 rounded-none focus-visible:ring-0 focus-visible:border-primary bg-slate-50/50"
                        placeholder="House No., Street, Barangay, City/Municipality, Province, ZIP Code"
                        value={formData.address}
                        onChange={(e) => handleInputChange("address", e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* ── SECTION C: Family Background ── */}
                <div className="border-b">
                  <div className="bg-slate-800 px-6 py-2 flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-slate-300" />
                    <span className="text-xs font-bold text-slate-200 uppercase tracking-widest">C. Family Background</span>
                  </div>
                  <div className="p-6 space-y-6">
                    {/* Father */}
                    <div>
                      <p className="text-[11px] font-bold text-slate-500 uppercase mb-3 tracking-widest border-b pb-1">Father</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <div className="flex justify-between"><Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Full Name</Label><button type="button" onClick={() => setNA("fatherName")} className="text-[10px] text-primary hover:underline font-bold uppercase">N/A</button></div>
                          <Input className="uppercase border-b-2 border-t-0 border-x-0 rounded-none focus-visible:ring-0 focus-visible:border-primary bg-slate-50/50" value={formData.fatherName} onChange={(e) => handleInputChange("fatherName", e.target.value)} placeholder='Full Name' />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between"><Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Occupation</Label><button type="button" onClick={() => setNA("fatherOccupation")} className="text-[10px] text-primary hover:underline font-bold uppercase">N/A</button></div>
                          <Input className="uppercase border-b-2 border-t-0 border-x-0 rounded-none focus-visible:ring-0 focus-visible:border-primary bg-slate-50/50" value={formData.fatherOccupation} onChange={(e) => handleInputChange("fatherOccupation", e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between"><Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Contact No.</Label><button type="button" onClick={() => setNA("fatherContact")} className="text-[10px] text-primary hover:underline font-bold uppercase">N/A</button></div>
                          <Input className="border-b-2 border-t-0 border-x-0 rounded-none focus-visible:ring-0 focus-visible:border-primary bg-slate-50/50" value={formData.fatherContact} onChange={(e) => handleInputChange("fatherContact", e.target.value)} />
                        </div>
                      </div>
                    </div>
                    {/* Mother */}
                    <div>
                      <p className="text-[11px] font-bold text-slate-500 uppercase mb-3 tracking-widest border-b pb-1">Mother</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <div className="flex justify-between"><Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Full Name (Maiden)</Label><button type="button" onClick={() => setNA("motherName")} className="text-[10px] text-primary hover:underline font-bold uppercase">N/A</button></div>
                          <Input className="uppercase border-b-2 border-t-0 border-x-0 rounded-none focus-visible:ring-0 focus-visible:border-primary bg-slate-50/50" value={formData.motherName} onChange={(e) => handleInputChange("motherName", e.target.value)} placeholder='Full Name' />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between"><Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Occupation</Label><button type="button" onClick={() => setNA("motherOccupation")} className="text-[10px] text-primary hover:underline font-bold uppercase">N/A</button></div>
                          <Input className="uppercase border-b-2 border-t-0 border-x-0 rounded-none focus-visible:ring-0 focus-visible:border-primary bg-slate-50/50" value={formData.motherOccupation} onChange={(e) => handleInputChange("motherOccupation", e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between"><Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Contact No.</Label><button type="button" onClick={() => setNA("motherContact")} className="text-[10px] text-primary hover:underline font-bold uppercase">N/A</button></div>
                          <Input className="border-b-2 border-t-0 border-x-0 rounded-none focus-visible:ring-0 focus-visible:border-primary bg-slate-50/50" value={formData.motherContact} onChange={(e) => handleInputChange("motherContact", e.target.value)} />
                        </div>
                      </div>
                    </div>
                    {/* Guardian */}
                    <div className="bg-amber-50/60 border border-amber-200/60 rounded-md p-4">
                      <p className="text-[11px] font-bold text-amber-700 uppercase mb-3 tracking-widest">In Case of Emergency / Legal Guardian</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Guardian Name</Label>
                          <Input className="uppercase border-b-2 border-t-0 border-x-0 rounded-none focus-visible:ring-0 focus-visible:border-primary bg-white/60" placeholder="Full Name" value={formData.guardianName} onChange={(e) => handleInputChange("guardianName", e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Relationship</Label>
                          <Input className="uppercase border-b-2 border-t-0 border-x-0 rounded-none focus-visible:ring-0 focus-visible:border-primary bg-white/60" value={formData.guardianRelationship} onChange={(e) => handleInputChange("guardianRelationship", e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Contact No.</Label>
                          <Input className="border-b-2 border-t-0 border-x-0 rounded-none focus-visible:ring-0 focus-visible:border-primary bg-white/60" value={formData.guardianContact} onChange={(e) => handleInputChange("guardianContact", e.target.value)} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── SECTION D: Educational Background ── */}
                <div>
                  <div className="bg-slate-800 px-6 py-2 flex items-center gap-2">
                    <School className="h-3.5 w-3.5 text-slate-300" />
                    <span className="text-xs font-bold text-slate-200 uppercase tracking-widest">D. Educational Background</span>
                  </div>
                  <div className="p-6">
                    <div className="border rounded-md overflow-hidden">
                      {/* Table Header */}
                      <div className="grid grid-cols-12 bg-slate-100 border-b px-4 py-2 text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                        <div className="col-span-2">Level</div>
                        <div className="col-span-7">School Name</div>
                        <div className="col-span-3 text-center">Year Graduated</div>
                      </div>
                      {/* Elementary */}
                      <div className="grid grid-cols-12 border-b px-4 py-3 items-center gap-3 hover:bg-slate-50/70 transition-colors">
                        <div className="col-span-2">
                          <span className="text-xs font-bold text-primary uppercase">Elementary</span>
                        </div>
                        <div className="col-span-7">
                          <Input className="uppercase border-b border-t-0 border-x-0 rounded-none focus-visible:ring-0 focus-visible:border-primary bg-transparent h-8 text-sm px-0" value={formData.elementarySchool} onChange={(e) => handleInputChange("elementarySchool", e.target.value)} placeholder="Name of School" />
                        </div>
                        <div className="col-span-3">
                          <Input className="border-b border-t-0 border-x-0 rounded-none focus-visible:ring-0 focus-visible:border-primary bg-transparent h-8 text-sm text-center px-0" placeholder="YYYY" value={formData.elementaryYear} onChange={(e) => handleInputChange("elementaryYear", e.target.value)} />
                        </div>
                      </div>
                      {/* JHS */}
                      <div className="grid grid-cols-12 border-b px-4 py-3 items-center gap-3 hover:bg-slate-50/70 transition-colors">
                        <div className="col-span-2">
                          <span className="text-xs font-bold text-primary uppercase">Junior HS</span>
                        </div>
                        <div className="col-span-7">
                          <Input className="uppercase border-b border-t-0 border-x-0 rounded-none focus-visible:ring-0 focus-visible:border-primary bg-transparent h-8 text-sm px-0" value={formData.highSchool} onChange={(e) => handleInputChange("highSchool", e.target.value)} placeholder="Name of School" />
                        </div>
                        <div className="col-span-3">
                          <Input className="border-b border-t-0 border-x-0 rounded-none focus-visible:ring-0 focus-visible:border-primary bg-transparent h-8 text-sm text-center px-0" placeholder="YYYY" value={formData.highSchoolYear} onChange={(e) => handleInputChange("highSchoolYear", e.target.value)} />
                        </div>
                      </div>
                      {/* SHS */}
                      <div className="grid grid-cols-12 px-4 py-3 items-center gap-3 hover:bg-slate-50/70 transition-colors">
                        <div className="col-span-2 flex items-center gap-1">
                          <span className="text-xs font-bold text-primary uppercase">Senior HS</span>
                        </div>
                        <div className="col-span-7">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] text-muted-foreground">School Name</span>
                            <button type="button" onClick={() => { setNA("seniorHighSchool"); setNA("seniorHighSchoolYear"); }} className="text-[10px] text-primary hover:underline font-bold uppercase">N/A</button>
                          </div>
                          <Input className="uppercase border-b border-t-0 border-x-0 rounded-none focus-visible:ring-0 focus-visible:border-primary bg-transparent h-8 text-sm px-0" value={formData.seniorHighSchool} onChange={(e) => handleInputChange("seniorHighSchool", e.target.value)} placeholder='Name of School or "N/A"' />
                        </div>
                        <div className="col-span-3">
                          <Input className="border-b border-t-0 border-x-0 rounded-none focus-visible:ring-0 focus-visible:border-primary bg-transparent h-8 text-sm text-center px-0" placeholder="YYYY" value={formData.seniorHighSchoolYear} onChange={(e) => handleInputChange("seniorHighSchoolYear", e.target.value)} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </>
          )}

          {step === 2 && (
            <>
              <CardHeader className="border-b bg-slate-50/50">
                <CardTitle className="text-2xl font-serif">II. Academic Program & Subject Selection</CardTitle>
                <CardDescription>Select your desired program and specific subjects for authorization.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <Label>Academic Program</Label>
                    <Select onValueChange={setSelectedCourseId} defaultValue={selectedCourseId}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select a course..." />
                      </SelectTrigger>
                      <SelectContent>
                        {courses?.map(course => (
                          <SelectItem key={course.id} value={course.id}>{course.name} ({course.code})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                   <div className="space-y-2">
                    <Label>Year Level</Label>
                    <Select value={formData.yearLevel} onValueChange={(val) => handleInputChange("yearLevel", val)}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select year level..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1st Year</SelectItem>
                        <SelectItem value="2">2nd Year</SelectItem>
                        <SelectItem value="3">3rd Year</SelectItem>
                        <SelectItem value="4">4th Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Semester</Label>
                    <Select value={formData.semester} onValueChange={(val) => handleInputChange("semester", val)}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select semester..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1st Semester">1st Semester</SelectItem>
                        <SelectItem value="2nd Semester">2nd Semester</SelectItem>
                        <SelectItem value="Summer">Summer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-800">Available Subjects</h3>
                      <p className="text-xs text-muted-foreground">Showing subjects for {formData.yearLevel}{Number(formData.yearLevel) === 1 ? 'st' : Number(formData.yearLevel) === 2 ? 'nd' : Number(formData.yearLevel) === 3 ? 'rd' : 'th'} Year - {formData.semester}</p>
                    </div>
                    <Badge variant="outline" className="font-mono bg-primary/5 text-primary border-primary/20">{enrolledSubjectIds.length} Subjects Selected</Badge>
                  </div>
                  
                  <div className="border rounded-xl overflow-hidden shadow-sm">
                    <div className="grid grid-cols-12 bg-slate-900 p-4 font-bold text-xs text-white uppercase tracking-wider">
                      <div className="col-span-1"></div>
                      <div className="col-span-2">Code</div>
                      <div className="col-span-5">Subject Name</div>
                      <div className="col-span-1 text-center">Units</div>
                      <div className="col-span-3">Schedule</div>
                    </div>
                    <div className="divide-y max-h-[400px] overflow-y-auto">
                      {subjects?.filter(s => {
                        const semMap: Record<string, string> = { "1st Semester": "1st", "2nd Semester": "2nd", "Summer": "Summer" };
                        return s.yearLevel === parseInt(formData.yearLevel) && s.semester === semMap[formData.semester];
                      }).map((subject) => (
                        <div key={subject.id} className="grid grid-cols-12 p-4 items-center text-sm hover:bg-blue-50/50 transition-colors">
                          <div className="col-span-1 flex justify-center">
                            <Checkbox 
                              checked={enrolledSubjectIds.includes(subject.id)}
                              onCheckedChange={() => toggleSubject(subject.id)}
                            />
                          </div>
                          <div className="col-span-2 font-mono text-xs font-bold text-primary">{subject.code}</div>
                          <div className="col-span-5 font-medium">{subject.name}</div>
                          <div className="col-span-1 text-center">{subject.units}</div>
                          <div className="col-span-3 text-muted-foreground text-[11px] font-mono leading-tight">{subject.schedule || "TBA"}</div>
                        </div>
                      ))}
                      {subjects && subjects.filter(s => {
                        const semMap: Record<string, string> = { "1st Semester": "1st", "2nd Semester": "2nd", "Summer": "Summer" };
                        return s.yearLevel === parseInt(formData.yearLevel) && s.semester === semMap[formData.semester];
                      }).length === 0 && (
                        <div className="p-16 text-center text-muted-foreground italic flex flex-col items-center gap-3 bg-slate-50/30">
                          <BookOpen className="h-10 w-10 opacity-10" />
                          <div className="space-y-1">
                            <p className="font-medium text-slate-400">No subjects found for this criteria.</p>
                            <p className="text-xs">Please contact the administrator or check your selection.</p>
                          </div>
                        </div>
                      )}
                      {!subjects && (
                        <div className="p-16 text-center text-muted-foreground italic flex flex-col items-center gap-3 bg-slate-50/30">
                          <Loader2 className="h-8 w-8 animate-spin opacity-20" />
                          <span>Loading available subjects...</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </>
          )}

          {step === 3 && (
            <>
              <CardHeader className="border-b bg-slate-50/50">
                <CardTitle className="text-2xl font-serif">III. Document Requirements</CardTitle>
                <CardDescription>
                  {isReturningStudent 
                    ? "Your previously submitted documents are already on file from your previous enrollment." 
                    : "Upload clear scanned copies or photos of your documentary requirements."}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                {isReturningStudent && (
                  <div className="bg-green-50 border border-green-200 p-6 rounded-xl flex items-center gap-4 mb-6">
                    <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                      <Check className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-green-900">Documents Previously Verified</h4>
                      <p className="text-sm text-green-800/80">You do not need to re-upload your diploma, report card, or other records. You may still update them below if you have new versions.</p>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Diploma */}
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 hover:border-primary/50 transition-colors bg-slate-50/50">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-800">Diploma</h4>
                        <p className="text-xs text-muted-foreground">High School or SHS Diploma</p>
                      </div>
                    </div>
                    <div className="relative">
                      <input 
                        type="file" 
                        className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload("diplomaUrl", file);
                        }}
                      />
                      <Button variant="outline" className="w-full bg-white border-slate-200" disabled={uploadingField === "diplomaUrl"}>
                        {uploadingField === "diplomaUrl" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {formData.diplomaUrl ? <><Check className="mr-2 h-4 w-4 text-green-600" /> Uploaded</> : <><Upload className="mr-2 h-4 w-4" /> Select File</>}
                      </Button>
                    </div>
                  </div>

                  {/* Form 138 */}
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 hover:border-primary/50 transition-colors bg-slate-50/50">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-800">Form 138 / Report Card</h4>
                        <p className="text-xs text-muted-foreground">Latest Report Card</p>
                      </div>
                    </div>
                    <div className="relative">
                      <input 
                        type="file" 
                        className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload("form138Url", file);
                        }}
                      />
                      <Button variant="outline" className="w-full bg-white border-slate-200" disabled={uploadingField === "form138Url"}>
                        {uploadingField === "form138Url" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {formData.form138Url ? <><Check className="mr-2 h-4 w-4 text-green-600" /> Uploaded</> : <><Upload className="mr-2 h-4 w-4" /> Select File</>}
                      </Button>
                    </div>
                  </div>

                  {/* Good Moral */}
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 hover:border-primary/50 transition-colors bg-slate-50/50">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-800">Good Moral Certificate</h4>
                        <p className="text-xs text-muted-foreground">Certified Good Moral</p>
                      </div>
                    </div>
                    <div className="relative">
                      <input 
                        type="file" 
                        className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload("goodMoralUrl", file);
                        }}
                      />
                      <Button variant="outline" className="w-full bg-white border-slate-200" disabled={uploadingField === "goodMoralUrl"}>
                        {uploadingField === "goodMoralUrl" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {formData.goodMoralUrl ? <><Check className="mr-2 h-4 w-4 text-green-600" /> Uploaded</> : <><Upload className="mr-2 h-4 w-4" /> Select File</>}
                      </Button>
                    </div>
                  </div>

                  {/* PSA */}
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 hover:border-primary/50 transition-colors bg-slate-50/50">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-800">PSA Birth Certificate</h4>
                        <p className="text-xs text-muted-foreground">Valid PSA Copy</p>
                      </div>
                    </div>
                    <div className="relative">
                      <input 
                        type="file" 
                        className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload("psaUrl", file);
                        }}
                      />
                      <Button variant="outline" className="w-full bg-white border-slate-200" disabled={uploadingField === "psaUrl"}>
                        {uploadingField === "psaUrl" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {formData.psaUrl ? <><Check className="mr-2 h-4 w-4 text-green-600" /> Uploaded</> : <><Upload className="mr-2 h-4 w-4" /> Select File</>}
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-primary/5 border border-primary/10 rounded-lg text-sm text-primary-foreground/80 flex items-start gap-3">
                  <div className="mt-0.5">ℹ️</div>
                  <p>Accepted file formats: PDF, JPG, PNG. Maximum file size: 5MB per file.</p>
                </div>
              </CardContent>
            </>
          )}

          {step === 4 && (
            <>
              <CardHeader className="border-b bg-slate-50/50">
                <CardTitle className="text-2xl font-serif">IV. Review & Finalize</CardTitle>
                <CardDescription>Review your information before submitting your enrollment application.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl space-y-4">
                  <h4 className="font-bold text-blue-900 flex items-center gap-2">
                    <Check className="h-5 w-5" /> Summary of Application
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-slate-600">Full Name:</div>
                    <div className="font-bold">{formData.lastName}, {formData.firstName} {formData.middleName}</div>
                    <div className="text-slate-600">Selected Course:</div>
                    <div className="font-bold text-primary">{courses?.find(c => c.id === selectedCourseId)?.name}</div>
                    <div className="text-slate-600">Year Level:</div>
                    <div className="font-bold">
                      {formData.yearLevel === "1" ? "1st Year" : 
                       formData.yearLevel === "2" ? "2nd Year" : 
                       formData.yearLevel === "3" ? "3rd Year" : 
                       formData.yearLevel === "4" ? "4th Year" : 
                       formData.yearLevel}
                    </div>
                    <div className="text-slate-600">Total Subjects:</div>
                    <div className="font-bold">{enrolledSubjectIds.length}</div>
                    <div className="text-slate-600">Documents attached:</div>
                    <div className="font-bold text-green-600">
                      {isReturningStudent ? "Previously Verified" : (formData.diplomaUrl && formData.form138Url && formData.goodMoralUrl && formData.psaUrl) ? "All Complete" : "Partial"}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-start gap-4 p-6 bg-yellow-50 rounded-xl border border-yellow-200">
                    <Checkbox id="certify" className="mt-1 h-5 w-5" />
                    <div className="grid gap-2 leading-none">
                      <label
                        htmlFor="certify"
                        className="text-sm font-bold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-yellow-900"
                      >
                        CERTIFICATION AND DATA PRIVACY CONSENT
                      </label>
                      <p className="text-xs text-yellow-800/80 leading-relaxed italic">
                        I hereby certify that all information given above are true and correct to the best of my knowledge. 
                        I also authorize ZDSPGC to collect, use and process my personal information in accordance with the 
                        Data Privacy Act of 2012 for the purpose of my school admission and enrollment.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </>
          )}

          <CardFooter className="flex justify-between border-t p-8 bg-slate-50/50">
            <Button 
              variant="outline" 
              onClick={handleBack} 
              disabled={step === 1 || enrollmentMutation.isPending}
              className="px-8 h-12"
            >
              <ChevronLeft className="mr-2 h-4 w-4" /> Go Back
            </Button>
            
            {step < 4 ? (
              <Button onClick={handleNext} className="px-10 h-12 bg-primary hover:bg-primary/90">
                Next Step <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button 
                className="bg-green-600 hover:bg-green-700 min-w-[200px] h-12 shadow-lg shadow-green-600/20" 
                onClick={handleSubmit} 
                disabled={enrollmentMutation.isPending}
              >
                {enrollmentMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                  </>
                ) : (
                  <>Submit Registration</>
                )}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </StudentLayout>
  );
}

