using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Dapper;
using Hangfire;
using Hangfire.LiteDB;
using Hangfire.MemoryStorage;
using Hangfire.PostgreSql;
using LiteDB;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.HttpsPolicy;
using Microsoft.AspNetCore.SpaServices.ReactDevelopmentServer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using voddy.Controllers;
using voddy.Controllers.BackgroundTasks.RecurringJobs;
using voddy.Data;
using voddy.Models;
using static voddy.Controllers.HandleDownloadStreams;


namespace voddy {
    public class Startup {
        public Startup(IConfiguration configuration) {
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services) {
            services.AddControllersWithViews();

            services.AddDistributedMemoryCache();
            services.AddSession();

            services.AddMvc();
            services.AddDbContext<DataContext>();

            // In production, the React files will be served from this directory
            services.AddSpaStaticFiles(configuration => { configuration.RootPath = "ClientApp/build"; });

            // hangfire
            new LiteDatabase("/storage/voddy/databases/hangfireDb.db");
            services.AddHangfire(c =>
                c.UseLiteDbStorage("/storage/voddy/databases/hangfireDb.db"));

            services.AddSignalR();
            services.AddCors(options => options.AddPolicy("CorsPolicy", builder => builder.AllowAnyMethod()
                .AllowAnyHeader()
                .WithOrigins("https://localhost:5001")
                .AllowCredentials()));
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env) {
            if (env.IsDevelopment()) {
                app.UseDeveloperExceptionPage();
            } else {
                app.UseExceptionHandler("/Error");
                // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
                app.UseHsts();
            }

            env.ContentRootPath = AddContentRootPathToDatabase(env.ContentRootPath);

            app.UseHttpsRedirection();
            app.UseStaticFiles(new StaticFileOptions {
                FileProvider = new PhysicalFileProvider(env.ContentRootPath),
                //RequestPath = "/voddy"
            });
            app.UseSpaStaticFiles();

            app.UseSession();

            app.UseRouting();

            app.UseEndpoints(endpoints => {
                endpoints.MapControllerRoute(
                    name: "default",
                    pattern: "{controller}/{action=Index}/{id?}");
                endpoints.MapHangfireDashboard();
                endpoints.MapHub<NotificationHub>("/notificationhub");
            });

            app.UseSpa(spa => {
                spa.Options.SourcePath = "ClientApp";

                if (env.IsDevelopment()) {
                    spa.UseReactDevelopmentServer(npmScript: "start");
                }
            });

            //hangfire
            var options = new BackgroundJobServerOptions();
            using (var context = new DataContext()) {
                var workerCountValue = context.Configs.FirstOrDefault(item => item.key == "workerCount");

                if (workerCountValue != null) {
                    options.WorkerCount = Int32.Parse(workerCountValue.value);
                }
            }

            options.Queues = new[] {"default"};
            options.ServerName = "MainServer";

            app.UseHangfireServer(options);

            var options2 = new BackgroundJobServerOptions {
                Queues = new[] {"single"},
                ServerName = "Single",
                WorkerCount = 1
            };
            app.UseHangfireServer(options2);

            // STARTUP JOBS

            RecurringJob.AddOrUpdate<StartupJobs>(item => item.RequeueOrphanedJobs(), "*/5 * * * *");
            RecurringJob.AddOrUpdate<StartupJobs>(item => item.StreamerCheckForUpdates(), "0 0 * * 0");
            RecurringJob.AddOrUpdate<StartupJobs>(item => item.TrimLogs(), "0 0 * * 0");
            RecurringJob.AddOrUpdate<StartupJobs>(item => item.CheckForStreamerLiveStatus(), "* * * * *");
            RecurringJob.AddOrUpdate<StartupJobs>(item => item.RemoveTemp(), "* * * * *");
            RecurringJob.AddOrUpdate<StartupJobs>(item => item.CheckStreamFileExists(), "*/5 * * * *");
            RecurringJob.AddOrUpdate<StartupJobs>(item => item.RefreshValidation(), "*/5 * * * *");
            RecurringJob.AddOrUpdate<StartupJobs>(item => item.CheckForUpdates(), "0 * * * *");

            app.UseCors("CorsPolicy");
        }


        public string AddContentRootPathToDatabase(string contentRootPath) {
            using (var context = new DataContext()) {
                var existingContentRootPath = context.Configs.FirstOrDefault(item => item.key == "contentRootPath");
                if (existingContentRootPath == null) {
                    context.Add(new Config {
                        key = "contentRootPath",
                        value = contentRootPath
                    });
                    context.SaveChanges();
                    return contentRootPath;
                }

                return existingContentRootPath.value;
            }
        }
    }
}