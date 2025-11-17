"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPicker } from './map-picker';
import { IssueCategory, IssuePriority } from '@/lib/types';
import { ArrowLeft, Loader2, Upload, X, ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { autoAssignToL1 } from '@/lib/utils/issue-helpers';

interface ReportIssueFormProps {
  userId: string;
}

export function ReportIssueForm({ userId }: ReportIssueFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<IssueCategory>('other');
  const [priority, setPriority] = useState<IssuePriority>('medium');
  const [latitude, setLatitude] = useState(40.7128);
  const [longitude, setLongitude] = useState(-74.0060);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + imageFiles.length > 5) {
      setError('You can upload a maximum of 5 images');
      return;
    }

    setImageFiles(prev => [...prev, ...files]);
    
    // Create preview URLs
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();
      
      const imageDataUrls = await Promise.all(
        imageFiles.map(file => {
          return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        })
      );

      const { data: newIssue, error: insertError } = await supabase
        .from('issues')
        .insert({
          title,
          description,
          category,
          priority,
          latitude,
          longitude,
          reporter_id: userId,
          status: 'submitted',
          images: imageDataUrls, // Store image data URLs
        })
        .select()
        .single();

      if (insertError) throw insertError;

      console.log('[v0] Issue created, attempting auto-assignment to L1');
      await autoAssignToL1(supabase, newIssue.id);

      router.push('/citizen');
    } catch (err) {
      console.error('Error submitting issue:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit issue');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardContent className="pt-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Issue Title *</Label>
            <Input
              id="title"
              placeholder="Brief description of the issue"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Provide detailed information about the issue..."
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={category} onValueChange={(val) => setCategory(val as IssueCategory)}>
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pothole">Pothole</SelectItem>
                  <SelectItem value="streetlight">Street Light</SelectItem>
                  <SelectItem value="garbage">Garbage Collection</SelectItem>
                  <SelectItem value="water_supply">Water Supply</SelectItem>
                  <SelectItem value="sewage">Sewage</SelectItem>
                  <SelectItem value="traffic">Traffic</SelectItem>
                  <SelectItem value="park">Park Maintenance</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority *</Label>
              <Select value={priority} onValueChange={(val) => setPriority(val as IssuePriority)}>
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="photos">Photos (Optional)</Label>
            <p className="text-sm text-muted-foreground">Upload up to 5 photos of the issue</p>
            
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('photo-input')?.click()}
                disabled={imageFiles.length >= 5}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Photos
              </Button>
              <span className="text-sm text-muted-foreground">
                {imageFiles.length} / 5 photos
              </span>
            </div>
            
            <input
              id="photo-input"
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageChange}
            />

            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border">
                    <img
                      src={preview || "/placeholder.svg"}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Location *</Label>
            <MapPicker
              latitude={latitude}
              longitude={longitude}
              onLocationChange={(lat, lng) => {
                setLatitude(lat);
                setLongitude(lng);
              }}
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button type="button" variant="outline" asChild className="flex-1">
              <Link href="/citizen">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Cancel
              </Link>
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isSubmitting ? 'Submitting...' : 'Submit Issue'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
