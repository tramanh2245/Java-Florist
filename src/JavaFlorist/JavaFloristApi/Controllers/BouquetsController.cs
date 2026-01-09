using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using JavaFloristApi.Data;
using JavaFloristApi.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Hosting;
using System.IO;
using System.Threading.Tasks;
using System;
using System.Linq;
using System.Collections.Generic;

namespace JavaFloristApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BouquetsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _webHostEnvironment;

        public BouquetsController(AppDbContext context, IWebHostEnvironment webHostEnvironment)
        {
            _context = context;
            _webHostEnvironment = webHostEnvironment;
        }

        // --- HELPER: Delete physical image file from server ---
        private void DeleteImageFile(string imageUrl)
        {
            if (string.IsNullOrEmpty(imageUrl)) return;

            // Extract filename from URL (e.g., /images/file.png -> file.png)
            var fileName = Path.GetFileName(imageUrl);
            var filePath = Path.Combine(_webHostEnvironment.WebRootPath, "images", fileName);

            if (System.IO.File.Exists(filePath))
            {
                System.IO.File.Delete(filePath);
            }
        }

        // GET: api/Bouquets
        // Public access: Get all bouquets with Occasion and Images
        [HttpGet]
        [AllowAnonymous]
        public IActionResult GetAll()
        {
            var bouquets = _context.Bouquets
                                   .Include(b => b.Occasion)
                                   .Include(b => b.Images)
                                   .ToList();
            return Ok(bouquets);
        }

        // GET: api/Bouquets/5
        // Public access: Get single bouquet details
        [HttpGet("{id}")]
        [AllowAnonymous]
        public IActionResult GetById(int id)
        {
            var bouquet = _context.Bouquets
                                  .Include(b => b.Occasion)
                                  .Include(b => b.Images)
                                  .FirstOrDefault(b => b.Bouquet_Id == id);

            if (bouquet == null) return NotFound();
            return Ok(bouquet);
        }

        // POST: api/Bouquets
        // Admin only: Create new bouquet and upload images
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create(
            [FromForm] string Name,
            [FromForm] int Price,
            [FromForm] int Occasion_Id,
            [FromForm] string? Description,
            [FromForm] List<IFormFile>? imageFiles
        )
        {
            var bouquetModel = new Bouquet
            {
                Name = Name,
                Price = Price,
                Occasion_Id = Occasion_Id,
                Description = Description
            };
            _context.Bouquets.Add(bouquetModel);
            await _context.SaveChangesAsync();

            // Handle image uploads if files are provided
            if (imageFiles != null && imageFiles.Count > 0)
            {
                int imageIndex = 0;
                foreach (var imageFile in imageFiles)
                {
                    // Generate unique filename
                    string uniqueFileName = Guid.NewGuid().ToString() + Path.GetExtension(imageFile.FileName);
                    string uploadsDir = Path.Combine(_webHostEnvironment.WebRootPath, "images");
                    string filePath = Path.Combine(uploadsDir, uniqueFileName);

                    // Save file to server
                    using (var fileStream = new FileStream(filePath, FileMode.Create))
                    {
                        await imageFile.CopyToAsync(fileStream);
                    }

                    // Save image record to database
                    var newImage = new Image
                    {
                        Url = $"/images/{uniqueFileName}",
                        Is_Main_Image = (imageIndex == 0), // First image is Main
                        Bouquet_Id = bouquetModel.Bouquet_Id
                    };
                    _context.Images.Add(newImage);
                    imageIndex++;
                }
                await _context.SaveChangesAsync();
            }
            return Ok(bouquetModel);
        }

        // PUT: api/Bouquets/5
        // Admin only: Update details, delete old images, add new images
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(
            int id,
            [FromForm] string Name,
            [FromForm] int Price,
            [FromForm] int Occasion_Id,
            [FromForm] string? Description,
            [FromForm] List<IFormFile>? newImageFiles,
            [FromForm] string? imageIdsToDelete
        )
        {
            var bouquet = await _context.Bouquets.FindAsync(id);
            if (bouquet == null) return NotFound();

            // Step 1: Update text fields
            bouquet.Name = Name;
            bouquet.Price = Price;
            bouquet.Occasion_Id = Occasion_Id;
            bouquet.Description = Description;

            // Step 2: Delete requested images
            if (!string.IsNullOrEmpty(imageIdsToDelete))
            {
                var idsToDelete = imageIdsToDelete.Split(',')
                                                  .Select(int.Parse)
                                                  .ToList();

                var imagesToDelete = await _context.Images
                    .Where(i => idsToDelete.Contains(i.Image_Id) && i.Bouquet_Id == id)
                    .ToListAsync();

                foreach (var image in imagesToDelete)
                {
                    DeleteImageFile(image.Url); // Remove from disk
                    _context.Images.Remove(image); // Remove from DB
                }
            }

            // Step 3: Add new images
            if (newImageFiles != null && newImageFiles.Count > 0)
            {
                foreach (var imageFile in newImageFiles)
                {
                    string uniqueFileName = Guid.NewGuid().ToString() + Path.GetExtension(imageFile.FileName);
                    string uploadsDir = Path.Combine(_webHostEnvironment.WebRootPath, "images");
                    string filePath = Path.Combine(uploadsDir, uniqueFileName);

                    using (var fileStream = new FileStream(filePath, FileMode.Create))
                    {
                        await imageFile.CopyToAsync(fileStream);
                    }

                    var newImage = new Image
                    {
                        Url = $"/images/{uniqueFileName}",
                        Is_Main_Image = false,
                        Bouquet_Id = id
                    };
                    _context.Images.Add(newImage);
                }
            }

            await _context.SaveChangesAsync();

            // Step 4: Ensure there is always one Main Image
            var remainingImages = await _context.Images
                .Where(i => i.Bouquet_Id == id)
                .ToListAsync();

            if (remainingImages.Any() && !remainingImages.Any(i => i.Is_Main_Image))
            {
                // If no main image exists, set the first one as Main
                remainingImages.First().Is_Main_Image = true;
                await _context.SaveChangesAsync();
            }

            return Ok(bouquet);
        }

        // DELETE: api/Bouquets/5
        // Admin only: Delete bouquet and its images
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public IActionResult Delete(int id)
        {
            var bouquet = _context.Bouquets.Include(b => b.Images).FirstOrDefault(b => b.Bouquet_Id == id);
            if (bouquet == null) return NotFound();

            // Delete physical image files
            if (bouquet.Images != null)
            {
                foreach (var image in bouquet.Images)
                {
                    DeleteImageFile(image.Url);
                }
            }

            // Remove from database (Cascade delete removes related images)
            _context.Bouquets.Remove(bouquet);
            _context.SaveChanges();
            return Ok(new { message = "Deleted" });
        }
    }
}