import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ImageIcon, Trash2 } from "lucide-react";

interface ImageUploadProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
  onChange: (value?: string) => void;
  disabled?: boolean;
}

const ImageUpload = React.forwardRef<HTMLDivElement, ImageUploadProps>(
  ({ className, value, onChange, disabled, ...props }, ref) => {
    const [preview, setPreview] = React.useState<string | undefined>(value);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          setPreview(base64String);
          onChange(base64String);
        };
        reader.readAsDataURL(file);
      }
    };

    const handleRemove = () => {
      setPreview(undefined);
      onChange(undefined);
    };

    return (
      <div
        ref={ref}
        className={cn(
          "relative w-24 h-24 border-2 border-dashed rounded-full flex items-center justify-center",
          "hover:border-primary/50 transition-colors duration-300",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
        {...props}
      >
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        {preview ? (
          <div className="relative w-full h-full">
            <img
              src={preview}
              alt="Uploaded"
              className="w-full h-full object-cover rounded-full"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -top-1 -right-1 h-6 w-6 z-20"
              onClick={handleRemove}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-muted-foreground">
            <ImageIcon className="h-6 w-6" />
          </div>
        )}
      </div>
    );
  }
);

ImageUpload.displayName = "ImageUpload";

export { ImageUpload };
