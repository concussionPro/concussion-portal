# Embed the SSTWatch app as a target inside the Capacitor iPhone project so a
# single archive carries iPhone app + watch app (one listing, one review).
# Sources stay in sst-watch/Sources — single source of truth; this target just
# compiles them. Idempotent: refuses to run twice.
require 'xcodeproj'

PROJ = '/Users/zaclewis/ConcussionPro/portal/sst-native/ios/App/App.xcodeproj'
project = Xcodeproj::Project.open(PROJ)
abort 'SSTWatch target already exists — nothing to do' if project.targets.any? { |t| t.name == 'SSTWatch' }

app_target = project.targets.find { |t| t.name == 'App' } or abort 'App target not found'
team = app_target.build_configurations.map { |c| c.build_settings['DEVELOPMENT_TEAM'] }.compact.first
team ||= project.root_object.attributes.dig('TargetAttributes', app_target.uuid, 'DevelopmentTeam')

watch = project.new_target(:application, 'SSTWatch', :watchos, '10.0')

# Source + resource files, referenced RELATIVE to the project (../../../sst-watch)
group = project.main_group.new_group('SSTWatch', '../../../sst-watch/Sources')
swifts = Dir['/Users/zaclewis/ConcussionPro/portal/sst-watch/Sources/*.swift'].sort
swifts.each do |f|
  ref = group.new_reference(File.basename(f))
  watch.source_build_phase.add_file_reference(ref)
end
assets = group.new_reference('Assets.xcassets')
watch.resources_build_phase.add_file_reference(assets)

watch.build_configurations.each do |config|
  bs = config.build_settings
  bs['PRODUCT_BUNDLE_IDENTIFIER'] = 'au.com.concussioneducation.sst.watchkitapp'
  bs['INFOPLIST_FILE'] = '$(SRCROOT)/../../../sst-watch/Sources/Info.plist'
  bs['CODE_SIGN_ENTITLEMENTS'] = '$(SRCROOT)/../../../sst-watch/Sources/SSTWatch.entitlements'
  bs['GENERATE_INFOPLIST_FILE'] = 'NO'
  bs['SDKROOT'] = 'watchos'
  bs['WATCHOS_DEPLOYMENT_TARGET'] = '10.0'
  bs['TARGETED_DEVICE_FAMILY'] = '4'
  bs['SWIFT_VERSION'] = '5.9'
  bs['MARKETING_VERSION'] = '1.0'
  bs['CURRENT_PROJECT_VERSION'] = '2'
  bs['ASSETCATALOG_COMPILER_APPICON_NAME'] = 'AppIcon'
  bs['CODE_SIGN_STYLE'] = 'Automatic'
  bs['DEVELOPMENT_TEAM'] = team if team
  bs['LD_RUNPATH_SEARCH_PATHS'] = ['$(inherited)', '@executable_path/Frameworks']
  bs['ENABLE_BITCODE'] = 'NO'
end

app_target.add_dependency(watch)

embed = project.new(Xcodeproj::Project::Object::PBXCopyFilesBuildPhase)
embed.name = 'Embed Watch Content'
embed.symbol_dst_subfolder_spec = :products_directory
embed.dst_path = '$(CONTENTS_FOLDER_PATH)/Watch'
app_target.build_phases << embed
embed.add_file_reference(watch.product_reference)

project.save
puts "OK — team=#{team.inspect}, targets=#{project.targets.map(&:name).inspect}"
